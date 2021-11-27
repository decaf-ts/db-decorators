// @ts-ignore
import {TestModelAsync} from "./TestModel";
import {AsyncRepository, Callback, Err, InjectableRegistryImp, setInjectablesRegistry} from "../src";
// @ts-ignore
import {TransactionalRepository} from "./TestRepository";

jest.setTimeout(1000000)

// declare var process : {
//     env: {
//         NODE_ENV: string
//     },
//     on: (...args: any[]) => void,
//     exit: (...args: any[]) => void,
//     send: (...args: any[]) => void
// }

describe(`Transactional Context Test`, function(){

    const testModel = new TestModelAsync();

    beforeEach(() => {
        jest.setTimeout(5000);
        setInjectablesRegistry(new InjectableRegistryImp());
    });

    it(`Instantiates`, function(){
        const testRepository: AsyncRepository<TestModelAsync> = new TransactionalRepository(1000, false);
        expect(testRepository).not.toBeNull();
    });

    it(`Fills Properties Nicely`, function(testFinished){
        const testRepository: AsyncRepository<TestModelAsync> = new TransactionalRepository(1000, false);

        testRepository.create("testModel.id", testModel, (err: Err, result?: TestModelAsync) => {
            expect(err).toBeUndefined();
            expect(result).toBeDefined();
            if (result){
                expect(result.id).toBeDefined();
                expect(result.updatedOn).toBeDefined();
                expect(result.createdOn).toBeDefined();
            }
            testFinished();
        });
    });

    it(`Schedules transactions properly`, (testFinished) => {
        const testRepository: AsyncRepository<TestModelAsync> = new TransactionalRepository(1500, true);

        const {ConsumerRunner, defaultComparer} = require('../bin/Consumer');

        const consumerRunner = new ConsumerRunner("create", true, (callback: Callback) => {

            let tm = new TestModelAsync();

            testRepository.create("testModel.id", tm, (err: Err, model?: TestModelAsync) => {
                expect(err).toBeUndefined();
                expect(model).toBeDefined();
                callback(err, model);
            });
        }, defaultComparer);

        consumerRunner.run(10, 100, 20, true, (err: Err) => {
            testFinished(err)
        })
    });
});
