import { serveFile } from "jsr:@std/http/file-server";
import * as path from "jsr:@std/path";
import removeDrums from "./removeDrums.ts";

const MIXED_DIR = Deno.env.get("MIXED_DIR") || "";
const TEMP_DIR = Deno.env.get("TEMP_DIR") || "";

const mixedFileMatch = new RegExp("(.[^..]+_m.mp3)");

// ottieni e spostati in cartella sorgente
const __dir = path.dirname(path.fromFileUrl(Deno.mainModule));
Deno.chdir(__dir)

// avvia server http
Deno.serve(async (req: Request) => {
    const url = new URL(req.url);
    console.log("URL :>> ", req.method, url.pathname);

    switch (url.pathname) {
        case "/": {
            switch (req.method) {

                // GET "/" -> pagina html
                case "GET": {
                    return serveFile(req, "index.html");
                }

                //POST "/" -> nuova traccia da cui rimuovere batteria
                case "POST": {
                    const file = (await req.formData()).get("file") as File;
                    const filePath = path.join(TEMP_DIR, file.name);
                    Deno.writeFileSync(filePath, await file.bytes());

                    setTimeout(() => {
                        const outPath = removeDrums(filePath) || "";
                        const outFileName = path.parse(outPath).base;

                        Deno.copyFileSync(outPath, path.join(MIXED_DIR, outFileName));

                        for (const track of Deno.readDirSync(TEMP_DIR)) {
                            Deno.removeSync(path.join(TEMP_DIR, track.name));
                        }
                    }, 500);

                    return Response.redirect(url.origin + "/");
                }
                default:
                    break;
            }
            break;
        }
        case "/update": {
            switch (req.method) {
                // GET "/update" -> lista di tutti i file in formato JSON
                case "GET": {
                    const filesFound: string[] = [];
                    for await (const file of Deno.readDir(MIXED_DIR)) {
                        if (mixedFileMatch.test(file.name)) {
                            filesFound.push(file.name);
                        }
                    }

                    return Response.json(filesFound);
                }
                default:
                    break;
            }
            break;
        }
        default:
            break;
    }

    // "***_m.mp3" -> restituisci audio da scaricare"
    if (mixedFileMatch.test(url.pathname)) {
        const filePath = decodeURI(url.pathname);

        const res = serveFile(req, path.join(MIXED_DIR, filePath));

        return res;
    }

    return serveFile(req, "index.html");
});
