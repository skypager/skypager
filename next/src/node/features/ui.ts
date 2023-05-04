import { features, Feature, FeatureState } from "../feature.js";
import colors from "chalk";
import figlet from "figlet";
import type { Fonts } from "figlet";
import inquirer from "inquirer";

interface UIState extends FeatureState {
  fonts?: Fonts[];
  colorPalette?: string[];
}

const _assignedColors: Record<string, string> = {};

type Color = keyof typeof colors;

type PrintFunction = (text: string) => void;
type ColoredPrintFunction = PrintFunction & {
  [color in Color]: (text: string) => void;
}

/**
 * The UI Feature is for building interactive, pretty terminal experiences.
 *
 * It provides a number of utilities for building a CLI, including:
 *
 * colors based on chalk
 * ascii art based on figlet
 * prompts based on inquirer
 */
export class UI<T extends UIState = UIState> extends Feature<T> {
  get initialState() : T {
    return ({
      enabled: true,
      colorPalette: ASSIGNABLE_COLORS,
      fonts: []
    } as unknown) as T
  }

  print!: ColoredPrintFunction

  afterInitialize() {
    this.hide("_assignedColors");

    // @ts-ignore-next-line
    this.print = (text: string) => console.log(text)

    for(let color of ['red','blue','green','yellow','cyan','magenta','dim']) {
      Object.assign(this.print, {
        // @ts-ignore-next-line
        [color]: (str: string) => this.print(colors[color](str)),
      })
    }
  }
  
  /**
   * Provides access to chalk.  Each named color can be chained, eg. ui.colors.blue.whiteBg.bold("text")
   */
  get colors(): typeof colors {
    return colors;
  }

  get colorPalette(): string[] {
    return this.state.get("colorPalette")!;
  }

  assignColor(name: string): (str: string) => string {
    const assignedCount = Object.keys(_assignedColors).length;

    if (_assignedColors[name]) {
      const assigned = _assignedColors[name];
      return this.colors.hex(assigned);
    } else {
      const pickedColor =
        this.colorPalette[assignedCount % this.colorPalette.length];
      _assignedColors[name] = pickedColor;
      return this.colors.hex(pickedColor);
    }
  }

  get randomColor() {
    const colors = Object.keys(this.colors);
    const index = Math.floor(Math.random() * colors.length);

    return colors[index];
  }

  /**
   * Returns an array of fonts for use with ascii art
   */
  get fonts(): string[] {
    const fonts = this.state.get("fonts")! || [];

    if (!fonts.length) {
      this.state.set("fonts", figlet.fontsSync());
    }

    return this.state.get("fonts")!;
  }

  /**
   * Creates a wizard which asks the questions and returns an object of answers.
   *
   * Check out inquirer on npm for options.
   *
   * TODO: Find out how to do types properly for this.
   */
  wizard(questions: any[], initialAnswers: any = {}) {
    return inquirer.createPromptModule()(questions, initialAnswers);
  }

  /**
   * Open text in the user's $EDITOR / $VISUAL environment variable.
   * If they save this file, the modified text will be returned to you.
   */
  async openInEditor(text: string, extension = ".ts") {
    const results = await new Promise((resolve, reject) => {
      /*
      editAsync(
        text,
        (err, result) => {
          if (err) {
            return reject(err);
          }

          return resolve(result);
        },
        {
          postfix: extension,
        }
      );
    */
    });

    return results;
  }

  asciiArt(text: string, font: Fonts) {
    return figlet.textSync(text, font);
  }

  banner(text: string, options: { font: Fonts; colors: Color[] }) {
    if (!options?.font || !Array.isArray(options?.colors)) {
      throw new Error(`Must supply { font: "string", colors: ["string"]}`);
    }

    const art = this.asciiArt(text, options.font);
    const colored = this.applyGradient(art, options.colors);

    return colored;
  }

  applyGradient(
    text: string,
    lineColors: Color[] = ["red", "white", "blue"],
    direction: "horizontal" | "vertical" = "horizontal"
  ) {
    if (direction === "horizontal") {
      return this.applyHorizontalGradient(text, lineColors);
    }

    return this.applyVerticalGradient(text, lineColors);
  }

  applyHorizontalGradient(
    text: string,
    lineColors: Color[] = ["red", "white", "blue"]
  ) {
    const gColors = Object.fromEntries(
      lineColors.map((color) => [color, this.colors[color]])
    );
    const lines = text.split("");

    const colored = lines.map((line, index) => {
      const colorFn = gColors[lineColors[index % lineColors.length]]!;
      // @ts-ignore-next-line
      return colorFn(line);
    });

    return colored.join("");
  }

  applyVerticalGradient(
    text: string,
    lineColors: Color[] = ["red", "white", "blue"]
  ) {
    const gColors = Object.fromEntries(
      lineColors.map((color) => [color, this.colors[color]])
    );
    const lines = text.split("\n");
    const colored = lines.map((line, index) => {
      const colorFn = gColors[lineColors[index % lineColors.length]]!;
      // @ts-ignore-next-line
      return colorFn(line);
    });

    return colored.join("\n");
  }

  padLeft(str: string, length: number, padChar = " ") {
    if (str.length >= length) {
      return str;
    }

    const padding = Array(length - str.length)
      .fill(padChar)
      .join("");
      
    return padding + str;
  }

  padRight(str: string, length: number, padChar = " ") {
    if (str.length >= length) {
      return str;
    }

    const padding = Array(length - str.length)
      .fill(padChar)
      .join("");
    return str + padding;
  }
}

export default features.register("ui", UI);

const ASSIGNABLE_COLORS = [
  "#FF6B6B",
  "#FFD166",
  "#4ECDC4",
  "#54C6EB",
  "#A3D9FF",
  "#88D498",
  "#9C89B8",
  "#F08A5D",
  "#B83B5E",
  "#6A2C70",
  "#F38181",
  "#95E1D3",
  "#EAFDE6",
  "#FCE38A",
  "#EAFFD0",
  "#BDE4F4",
];
