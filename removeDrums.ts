import * as path from "jsr:@std/path";
import * as fs from "jsr:@std/fs";

// rimuovi traccia di batteria da un file .mp3
export default function removeDrums(filepath: string): string | undefined {
    // controllo file di input
    if (!fs.existsSync(filepath)) {
        console.error(filepath + "Doesn't exist!");
        return;
    }

    // ottieni percorso file di input
    const absFile = Deno.realPathSync(filepath);

    // ottieni e sposta in cartella del file sorgente
    const __dir = path.dirname(path.fromFileUrl(Deno.mainModule));

    Deno.chdir(__dir);

    console.log("Inizio separazione tracce di " + absFile);

    // separa audio in tracce con spleeter
    const splitCommand = new Deno.Command("spleeter", {
        args: ["separate", "-o", "./", "-p", "spleeter:4stems", absFile],
        stdout: "piped",
    });
    const { stdout: splitOut } = splitCommand.outputSync();
    console.log("Spleeter:\n", new TextDecoder().decode(splitOut));
    console.log("Tracce separate correttamente!");

    const mixOutDir = path.parse(filepath).name;
    const absFilePath = path.parse(absFile).dir;
    const resultFilePath = path.join(absFilePath, mixOutDir + "_m.mp3");

    // unisci tracce con ffmpeg (tranne batteria)
    const mixCommand = new Deno.Command("ffmpeg", {
        args: [
            "-y",
            "-i",
            path.join(mixOutDir, "\\bass.wav"),
            "-i",
            path.join(mixOutDir, "\\other.wav"),
            "-i",
            path.join(mixOutDir, "\\vocals.wav"),
            "-filter_complex",
            "amix=inputs=3,volume=3",
            resultFilePath,
        ],
        stdout: "piped",
    });

    const { stdout: mixOut } = mixCommand.outputSync();
    console.log("FFmpeg:", new TextDecoder().decode(mixOut));
    console.log("Tracce unite correttamente!");


    // rimuovi cartella con tracce utilizzate
    for (const track of Deno.readDirSync(mixOutDir)) {
        Deno.removeSync(path.join(mixOutDir, track.name));
    }
    Deno.removeSync(mixOutDir);
    console.log("File temporanei rimossi!");

    // torna a cartella di input
    Deno.chdir(absFilePath);

    console.log("Nuovo file: " + resultFilePath);

    return resultFilePath;
}
