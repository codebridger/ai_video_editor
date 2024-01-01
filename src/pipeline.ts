import inquirer from "inquirer";
import fuzzyPrompt from "inquirer-fuzzy-path";

inquirer.registerPrompt("fuzzypath", fuzzyPrompt);

export function run() {
  inquirer
    .prompt([
      {
        type: "fuzzypath",
        name: "path",
        message: "Where is the file you want to convert?",
        rootPath: "./",
      },
    ])
    .then((answers) => {
      console.log(answers);
    });
}
