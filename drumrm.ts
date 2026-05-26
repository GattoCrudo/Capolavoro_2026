import removeDrums from "./removeDrums.ts";

for (let i = 0; i < Deno.args.length; i++) {
    setTimeout(removeDrums, 1000 * i, Deno.args[i]);
}
