import Model from '@tvenceslau/decorator-validation/lib/Model/Model';
import {constructFromObject} from '../utils';
import ModelErrorDefinition from "@tvenceslau/decorator-validation/lib/Model/ModelErrorDefinition";
import {validateCompare} from "../validation/validation";
import {all} from "../logging";

/**
 * Abstract class representing a Validatable DBModel object
 *
 * @see Model
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

    /**
     * @param {DBModel | any} [previousVersion] validates an update via the {@link DBModel} decorators
     * @param {any[]} [exclusions] {@see Model#hasErrors}
     */
    hasErrors(previousVersion?: DBModel | any, ...exclusions: any[]): ModelErrorDefinition | undefined {
        if (!(previousVersion instanceof DBModel)){
            exclusions.unshift(previousVersion);
            previousVersion = undefined;
        }

        let errs = super.hasErrors(...exclusions);
        if (!previousVersion)
            return errs;

        all(`Now comparing ${previousVersion.toString()} with ${this.toString()}`);
        return validateCompare(previousVersion, this, ...exclusions);
    }
}
