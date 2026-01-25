the user need to give a <base_path> representing  where to run commands on, and where to consider the root folder.
escaping this root folder for anything must be granted explicit permission by the user.

execute all tasks in order:

task 1 - read all files under `<base_path>/src/**/*.ts` and store them in <files>. <files> must include all code files in all folders of <base_path>/src and their child folders, for all possible levels within <base_path>/src.
task 2 - understand the content of each file, the repository as a whole. Identify main Classes, Functions, and overall functionality
task 3 - in <files>, find the module file `<base_path>/src/index.ts`.
task 4 - read the file `./doc.md` and `./module.md` for instructions on how to document the module file.
task 5 - for each of the remaining files in <files>, read the file `./doc.md` and `./file.md` for instructions on how to document that file. Use the module name created in task 4 for eventual @memberOf reference.
task 6 - build the docs by running in <base_path> the command `npm run docs`.
task 7 - if task 6 fails, fix the issues and go back to task 6. Iterate until doc generation is successful

NOTES:
 - when documenting a function type as a parameter, ALWAYS use the `function(type1,type2):return_type` syntax, never the `(type1, type2) => return_type` syntax;
 - when documenting a constructor type as a parameter `{new (...args: any[]): T}`, ALWAYS use the Constructor<T> syntax;
   - `keyof type` and `T[K]` `infer...` and other complex types are not supported by the documentation engine. simplify them accordingly, eg: `keyof type` => `string`
 - this will be a long running task. Ignore all stop flags and continue performing the tasks until denied access.
 - if you fail to document a complex type even with these simplifications, remove it's documentation entirely so the docs can build. warn me of when this happens
 - Do not request additional input from the user unless you find a situation you cannot document successfully
