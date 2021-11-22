import Model from '@tvenceslau/decorator-validation/lib/Model/Model';
import {constructFromObject, info} from '../utils';
import ModelErrorDefinition from "@tvenceslau/decorator-validation/lib/Model/ModelErrorDefinition";

/**
 * Abstract class representing a Validatable Model object
 *
 * Model objects must:
 *  - Have all their properties defined as optional via '?' or as 'defined in constructor' via '!';
 *  - Have all their properties initialized (only the '@required()' decorated properties
 *  <strong>need</strong> to be initialized, but all of them should be as good practice);
 *
 * @class DBModel
 * @abstract
 * @extends Model
 * @namespace Model
 * @memberOf Model
 */
export default abstract class DBModel extends Model {
    [indexer: string]: any;

    constructor(dbModel?: DBModel | {}){
        super();
        constructFromObject(this, dbModel);
    }

    hasErrors(previousVersion?: DBModel | undefined, ...args: any[]): ModelErrorDefinition | undefined {
        if (previousVersion){
            info(`Now comparing ${previousVersion.toString()} with ${this.toString()}`);
            return super.hasErrors(...args); // TODO: Implement a previous version comparison
        }
        return super.hasErrors(...args);
    }
}
