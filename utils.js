// @ts-check

const { spawn, exec } = require("child_process");
const { writeFile } = require("fs");

const promisify = (func) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      func(...args, (error, ...response) => {
        if (error) reject(error);
        resolve(response);
      });
    });
  };
};

/** @typedef {(cppcode: string, args: string[], stdin?: string) => Promise<{stdout?: string, time?: number, error?: string}>} Runner */

/** @type {Runner} */
const runcpp = async (cppcode, args, stdin) => {
  try {
    let time = 0;
    await promisify(writeFile)("__a.cpp", cppcode);
    await promisify(exec)("g++ __a.cpp -o __a.out", null);

    const [stdout, error] = await new Promise((resolve) => {
      const start = Date.now();
      const subprocess = spawn("./__a.out", [...(args ?? [])]);

      let result = "";
      let error = "";

      subprocess.stdout.on("data", (data) => {
        result += data.toString();
      });

      subprocess.stderr.on("data", (data) => {
        error += data.toString();
      });

      if (stdin) subprocess.stdin.end(stdin ?? "");

      subprocess.stdout.on("close", () => {
        time = Date.now() - start;
        resolve([result, error]);
      });
    });

    await promisify(exec)("rm __a.cpp __a.out", null);
    return { stdout, time, error };
  } catch (e) {
    return { error: e.message };
  }
};

/** @type {Runner} */
const runjs = async (jscode, args, stdin) => {
  try {
    let time = 0;
    await promisify(writeFile)("__a.js", jscode);

    const [stdout, error] = await new Promise((resolve) => {
      const start = Date.now();
      const subprocess = spawn("node", ["__a.js", ...(args ?? [])]);

      let result = "";
      let error = "";

      subprocess.stdout.on("data", (data) => {
        result += data.toString();
      });

      subprocess.stderr.on("data", (data) => {
        error += data.toString();
      });

      if (stdin) subprocess.stdin.end(stdin ?? "");

      subprocess.stdout.on("close", () => {
        time = Date.now() - start;
        resolve([result, error]);
      });
    });

    await promisify(exec)("rm __a.js", null);
    return { stdout, time, error };
  } catch (e) {
    return { error: e.message };
  }
};

const enterQueue = (() => {
  const queue = [];
  let idle = true;
  const limit = 3;

  const makeLeave = () => {
    let hasLeft = false;
    return () => {
      if (hasLeft) return;
      hasLeft = true;
      if (queue.length) {
        queue.shift()(makeLeave());
      } else {
        idle = true;
      }
    };
  };

  return () => {
    return new Promise((res, rej) => {
      if (queue.length >= limit) return rej("queue limit exceeded");
      if (idle) {
        idle = false;
        res(makeLeave());
      } else {
        queue.push(res);
      }
    });
  };
})();

module.exports = {
  runcpp,
  runjs,
  enterQueue,
};
