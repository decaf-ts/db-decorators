
const {fork} = require('child_process');


class ConsumerRunner {

    constructor(action, isAsync, consumerHandler, compareHandler){
        this.action = action;
        this.isAsync = isAsync;
        this._handler = consumerHandler;
        this._comparerHandle = compareHandler;
        this._reset();
    }

    _reset(){
        this._forkedCache = [];
        this._consumerResults = {};
        this._producerResults = {};
    }

    _store(identifier, result){
        this._producerResults[identifier] = result;
    }

    _compareResults(callback){
        if (this.isAsync)
            return this._comparerHandle(this._consumerResults, this._producerResults, callback)
        try{
            callback(undefined, this._comparerHandle(this._consumerResults, this._producerResults));
        } catch (e){
            return callback(e);
        }
    }

    _tick(identifier, count, callback){
        const log = [Date.now(), "CONSUMER", identifier, this.action]
        this._consumerResults[identifier] = this._consumerResults[identifier] || [];
        this._consumerResults[identifier].push(log.join(' - '));

        if (Object.keys(this._producerResults).length === count){
            this._forkedCache.forEach((forked, i) => {
                forked.send({
                    identifier: i,
                    terminate: true
                });
            });
            this._compareResults(callback)
        }
    }

    run(count, timeout, times, random, callback) {
        const self = this;
        self._reset();
        for(let i = 1; i < count + 1; i++){
            const forked = fork('./bin/ProducerChildProcess.js');
            self._forkedCache.push(forked);
            forked.on('message', (message) => {
                let {identifier, result, args} = message;
                if (result){
                    self._store(identifier, result, count);
                    return self._tick(identifier, count, callback);
                }

                args = args || [];

                try{
                    if (self.isAsync){
                        return self._handler(...args, () => {
                            self._tick(identifier, count, callback);
                        });
                    }

                    self._handler(...args);
                    self._tick(identifier, count, callback);
                } catch (e) {
                    return callback(e);
                }
            });
        }

        self._forkedCache.forEach((forked, i) => {
            forked.send({
                identifier: i,
                action: self.action,
                timeout: timeout,
                times: times,
                random: random
            })
        })
    }
}

module.exports = {
    ConsumerRunner
}