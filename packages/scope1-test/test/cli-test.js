let child_process = require('child_process');

describe("The command1 script", function () {
  it("should see all", () => {
    return new Promise((resolve, reject) => {
      let program = child_process.spawn(__dirname + "/../node_modules/.bin/command1");
      let stdout = ""
      program.stdout.on("data", data => { stdout += data; });
      program.on("exit", exitCode => {
        setTimeout(
          () => resolve({stdout:stdout, exitCode:exitCode}), 0
        )
      })
      program.on("error", err => { reject(err); })
    }).then(result => {
      if (!result.stdout.includes("sees all"))
        throw new Error("saw " + JSON.stringify(result))
    })
  })
})
