export class AsyncMessagePort {
    #port
    #messageCounter
    #listeners
    #genericListeners

    constructor(messagePort) {
        this.#port = messagePort;
        this.#messageCounter = 0;

        this.#listeners = new Map();
        this.#genericListeners = [];

        this.#port.onmessage = (e) => {
            const answer = new AsyncMessage(e.data.msgId, e.data.msg, this);
            if (e.data.refId !== null) {
                const listener = this.#listeners.get(e.data.refId);
                this.#listeners.delete(e.data.refId);
                listener[0](answer);
            } else {
                for (let listener of this.#genericListeners) {
                    listener(answer);
                }
            }
        };
    }

    async postMessage(message, refId = null) {
        const messageId = this.#messageCounter++;

        return new Promise((resolve, reject) => {
            this.#listeners.set(messageId, [resolve, reject]);

            this.#port.postMessage({
                msgId : messageId,
                refId : refId,
                msg : message
            });
        });
    }

    addMessageListener(callback) {
        this.#genericListeners.push(callback);
    }

    removeMessageListener(callback) {
        if (this.#genericListeners.indexOf(callback) === -1) return;
        
        this.#genericListeners.splice(this.#genericListeners.indexOf(callback), 1);
    }
}

class AsyncMessage {
    #messageID
    #message
    #port

    constructor(messageID, message, port) {
        this.#messageID = messageID;
        this.#message = message;
        this.#port = port;
    }

    get data() {
        return this.#message;
    }

    async postAnswer(message) {
        return await this.#port.postMessage(message, this.#messageID);
    }
}
