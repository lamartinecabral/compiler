// @ts-check

const { elem: h, style, getElem: get, getParent } = iuai;

style("textarea", {
  width: "100%",
  height: "15em",
});
style("", {});

const elements = [
  h("label", { htmlFor: "lang" }, "Language: "),
  h("select", { id: "lang" }, [
    h("option", { value: "js" }, "js"),
    h("option", { value: "cpp" }, "cpp"),
  ]),
  h("br"),
  h("label", { htmlFor: "code" }, "Code:"),
  h("textarea", { id: "code" }),
  h("label", { htmlFor: "stdin" }, "Stdin:"),
  h("textarea", { id: "stdin" }),
  h("button", { id: "submit" }, "Submit"),
  h("div", { hidden: true }, [h("p", "Stdout:"), h("pre", { id: "stdout" })]),
  h("p", { id: "time", hidden: true }),
  h("pre", { id: "error", hidden: true }),
  h("p", { id: "loading", hidden: true }, "compiling..."),
];

document.body.append(...elements);

get("submit").addEventListener("click", () => {
  var lang = get("lang", "select").value;
  var code = get("code", "textarea").value;
  var stdin = get("stdin", "textarea").value;
  get("loading").hidden = false;
  fetch("/compile", {
    method: "POST",
    body: JSON.stringify({ lang, code, stdin }),
  })
    .then((a) => a.json())
    .catch((e) => ({
      error: e?.message ?? e ?? "There is something wrong",
    }))
    .then(({ stdout, time, error }) => {
      get("loading").hidden = true;
      get("stdout").innerText = stdout;
      getParent("stdout").hidden = !stdout;
      get("time").innerText = `Took ${time}ms`;
      get("time").hidden = !time;
      get("error").innerText = `Error: ${error}`;
      get("error").hidden = !error;
    });
});

const template = {
  cpp: `
#include <iostream>
using namespace std;
int main(){
  string s;
  while(cin >> s) cout << s << endl;
  return 0;
}
`.trim(),
  js: `
const input = require("fs").readFileSync(0, "utf8");
console.log(input);
`.trim(),
};

get("code", "textarea").value = template.js;
get("lang").addEventListener("change", () => {
  get("code", "textarea").value = template[get("lang", "select").value] ?? "";
});
