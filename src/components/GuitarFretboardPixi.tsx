import { useRef, useState, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import * as Tone from 'tone';

// OOP Classes for Guitar Elements
class GuitarString {
    private graphics: PIXI.Graphics;
    private thickness: number;
    private color: number;

    constructor(index: number, y: number, width: number) {
        this.graphics = new PIXI.Graphics();
        this.thickness = this.getThickness(index);
        this.color = this.getColor(index);
        this.draw(y, width);
    }

    private getThickness(index: number): number {
        const thicknesses = [2, 1.5, 1, 1, 0.5, 0.5];
        return thicknesses[index];
    }

    private getColor(index: number): number {
        // Colors: silver for thin, bronze for thick
        const colors = [0xcccccc, 0xbbbbbb, 0xd4af37, 0xcd853f, 0xb8860b, 0xa0522d];
        return colors[index];
    }

    private draw(y: number, width: number): void {
        this.graphics.clear();
        this.graphics.lineStyle(this.thickness, this.color);
        this.graphics.moveTo(0, y);
        this.graphics.lineTo(width, y);
    }

    getGraphics(): PIXI.Graphics {
        return this.graphics;
    }
}

class Fret {
    private graphics: PIXI.Graphics;
    private x: number;

    constructor(x: number, height: number) {
        this.x = x;
        this.graphics = new PIXI.Graphics();
        this.draw(height);
    }

    private draw(height: number): void {
        this.graphics.clear();
        this.graphics.lineStyle(1, 0x666666, 0.5);
        this.graphics.moveTo(this.x, 0);
        this.graphics.lineTo(this.x, height);
    }

    getGraphics(): PIXI.Graphics {
        return this.graphics;
    }
}

class NoteDot {
    private graphics: PIXI.Graphics;
    private x: number;
    private y: number;
    private isPlaying: boolean = false;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.graphics = new PIXI.Graphics();
        this.draw();
    }

    private draw(): void {
        this.graphics.clear();
        if (this.isPlaying) {
            this.graphics.beginFill(0xff0000, 0.8);
        } else {
            this.graphics.beginFill(0xffffff, 0.1);
        }
        this.graphics.drawCircle(this.x, this.y, 8);
        this.graphics.endFill();
    }

    getGraphics(): PIXI.Graphics {
        return this.graphics;
    }

    setPlaying(playing: boolean): void {
        this.isPlaying = playing;
        this.draw();
    }
}

class GuitarFretboard {
    private container: PIXI.Container;
    private strings: GuitarString[] = [];
    private frets: Fret[] = [];
    private noteDots: NoteDot[][] = [];
    public width: number;
    public height: number;
    public numStrings = 6;
    public numFrets = 21;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.container = new PIXI.Container();
        this.createFretboard();
    }

    private createFretboard(): void {
        // Create strings
        for (let i = 0; i < this.numStrings; i++) {
            const y = (i * this.height) / (this.numStrings - 1);
            const string = new GuitarString(i, y, this.width);
            this.strings.push(string);
            this.container.addChild(string.getGraphics());
        }

        // Create frets
        for (let i = 1; i < this.numFrets; i++) {
            const x = (i * this.width) / this.numFrets;
            const fret = new Fret(x, this.height);
            this.frets.push(fret);
            this.container.addChild(fret.getGraphics());
        }

        // Create note dots
        for (let string = 0; string < this.numStrings; string++) {
            this.noteDots[string] = [];
            for (let fret = 0; fret < this.numFrets; fret++) {
                const x = (fret * this.width) / this.numFrets + (this.width / this.numFrets) / 2;
                const y = (string * this.height) / (this.numStrings - 1);
                const dot = new NoteDot(x, y);
                this.noteDots[string].push(dot);
                this.container.addChild(dot.getGraphics());
            }
        }
    }

    getContainer(): PIXI.Container {
        return this.container;
    }

    setNotePlaying(string: number, fret: number, playing: boolean): void {
        if (this.noteDots[string] && this.noteDots[string][fret]) {
            this.noteDots[string][fret].setPlaying(playing);
        }
    }
}

interface GuitarFretboardPixiProps {
    width: number;
    height: number;
}

export default function GuitarFretboardPixi({ width, height }: GuitarFretboardPixiProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [guitar, setGuitar] = useState<GuitarFretboard | null>(null);
    const [synth, setSynth] = useState<Tone.PolySynth | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const newApp = new PIXI.Application({
            view: canvasRef.current,
            width,
            height,
            backgroundColor: 0x1e293b,
        });

        const newGuitar = new GuitarFretboard(width, height);
        newApp.stage.addChild(newGuitar.getContainer());

        newApp.stage.interactive = true;
        newApp.stage.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
            if (!guitar || !synth) return;

            const localPos = event.getLocalPosition(newApp.stage);
            const string = Math.round((localPos.y / height) * (newGuitar.numStrings - 1));
            const fret = Math.round((localPos.x / width) * newGuitar.numFrets);

            if (string >= 0 && string < newGuitar.numStrings && fret >= 0 && fret < newGuitar.numFrets) {
                playNoteInternal(string, fret, newSynth, newGuitar);
            }
        });

        setGuitar(newGuitar);

        // Initialize Tone.js
        const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.25 }).toDestination();
        const dist = new Tone.Distortion({ distortion: 0.12, wet: 0.08 }).connect(reverb);
        const filter = new Tone.Filter({ type: 'lowpass', frequency: 4200, Q: 1.2 }).connect(dist);
        const newSynth = new Tone.PolySynth(Tone.Synth, {
            volume: -8,
            oscillator: { type: 'triangle', partialCount: 6 },
            envelope: { attack: 0.002, decay: 0.45, sustain: 0.16, release: 1.8 }
        }).connect(filter);

        setSynth(newSynth);

        return () => {
            newSynth.dispose();
            filter.dispose();
            reverb.dispose();
            newApp.destroy();
        };
    }, []);

    const getNoteNameFromFret = (stringIndex: number, fret: number): string => {
        const openStringNotes: number[] = [7, 0, 5, 10, 2, 7]; // E, A, D, G, B, E in note indices (0 = C)
        const noteNames: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const baseOctaves: number[] = [2, 2, 3, 3, 3, 4]; // Starting octave for each string

        const noteIndex: number = (openStringNotes[stringIndex] + fret) % 12;
        const octave: number = baseOctaves[stringIndex] + Math.floor((openStringNotes[stringIndex] + fret) / 12);

        return `${noteNames[noteIndex]}${octave}`;
    };

    const playNoteInternal = (string: number, fret: number, synth: Tone.PolySynth, guitar: GuitarFretboard) => {
        const noteName = getNoteNameFromFret(string, fret);

        guitar.setNotePlaying(string, fret, true);

        synth.triggerAttackRelease(noteName, "2n");

        setTimeout(() => {
            guitar.setNotePlaying(string, fret, false);
        }, 1000);
    };

    const playChord = (chordName: string): void => {
        if (!synth || !guitar) return;

        const chords: { [key: string]: { string: number; fret: number }[] } = {
            "E Major": [
                { string: 0, fret: 0 },  // Low E string open
                { string: 1, fret: 2 },  // A string 2nd fret
                { string: 2, fret: 2 },  // D string 2nd fret
                { string: 3, fret: 1 },  // G string 1st fret
                { string: 4, fret: 0 },  // B string open
                { string: 5, fret: 0 }   // High E string open
            ],
            "A Major": [
                { string: 0, fret: 0 },  // Low E string open (muted in real playing)
                { string: 1, fret: 0 },  // A string open
                { string: 2, fret: 2 },  // D string 2nd fret
                { string: 3, fret: 2 },  // G string 2nd fret
                { string: 4, fret: 2 },  // B string 2nd fret
                { string: 5, fret: 0 }   // High E string open
            ],
            "D Major": [
                { string: 0, fret: 0 },  // Low E string (muted in real playing)
                { string: 1, fret: 0 },  // A string open (muted in real playing)
                { string: 2, fret: 0 },  // D string open
                { string: 3, fret: 2 },  // G string 2nd fret
                { string: 4, fret: 3 },  // B string 3rd fret
                { string: 5, fret: 2 }   // High E string 2nd fret
            ],
            "G Major": [
                { string: 0, fret: 3 },  // Low E string 3rd fret
                { string: 1, fret: 2 },  // A string 2nd fret
                { string: 2, fret: 0 },  // D string open
                { string: 3, fret: 0 },  // G string open
                { string: 4, fret: 0 },  // B string open
                { string: 5, fret: 3 }   // High E string 3rd fret
            ],
            "C Major": [
                { string: 0, fret: 0 },  // Low E string (muted in real playing)
                { string: 1, fret: 3 },  // A string 3rd fret
                { string: 2, fret: 2 },  // D string 2nd fret
                { string: 3, fret: 0 },  // G string open
                { string: 4, fret: 1 },  // B string 1st fret
                { string: 5, fret: 0 }   // High E string open
            ]
        };

        const positions = chords[chordName];
        if (!positions) return;

        positions.forEach((pos, index) => {
            setTimeout(() => {
                playNoteInternal(pos.string, pos.fret, synth, guitar);
            }, index * 30);
        });
    };

    return (
        <div>
            <div className="flex space-x-2 mb-4 flex-wrap">
                <button
                    onClick={() => playChord("E Major")}
                    className="px-3 py-1 m-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    E Major
                </button>
                <button
                    onClick={() => playChord("A Major")}
                    className="px-3 py-1 m-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    A Major
                </button>
                <button
                    onClick={() => playChord("D Major")}
                    className="px-3 py-1 m-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    D Major
                </button>
                <button
                    onClick={() => playChord("G Major")}
                    className="px-3 py-1 m-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    G Major
                </button>
                <button
                    onClick={() => playChord("C Major")}
                    className="px-3 py-1 m-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    C Major
                </button>
            </div>
            <canvas ref={canvasRef} width={width} height={height} style={{ border: '1px solid #ccc' }} />
        </div>
    );
}