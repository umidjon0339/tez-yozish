const fs = require('fs');
let code = fs.readFileSync('app/typing-ninja/NinjaWorld.tsx', 'utf8');

// 1. Update GameState type
code = code.replace(/type GameState = "MENU" \| "PLAYING" \| "GAME_OVER";/, 'type GameState = "MENU" | "PLAYING" | "GAME_OVER" | "PAUSED";');

// 2. Add Top Right Pause Button
const topBarHTML = `<div className="absolute top-4 left-4 flex gap-4 text-white z-10">`;
code = code.replace(topBarHTML, `
            {gameState === 'PLAYING' && (
                <div className="absolute top-4 right-4 z-50">
                    <button onClick={() => setGameState('PAUSED')} className="bg-[#554e44] text-white border-4 border-[#4a4339] px-4 py-2 rounded font-black text-lg tracking-widest hover:scale-105 transition-transform shadow-md">
                        ⏸ PAUSE
                    </button>
                </div>
            )}
            ${topBarHTML}`);

// 3. Update the Tablet UI for PAUSED and GAME_OVER
const tabletUI = `{gameState === 'MENU' ? 'Ninja Run' : 'Game Over'}`;
code = code.replace(tabletUI, `{gameState === 'MENU' ? 'Ninja Run' : gameState === 'PAUSED' ? 'Paused' : 'Game Over'}`);

// 4. Update the buttons section
const gameOverButtons = `{gameState === 'GAME_OVER' && (
                            <div className="flex flex-col gap-4 mt-6 w-full">
                                <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                    <button onClick={() => startGame(difficulty)} className="w-full bg-[#3ea0e6] text-white border-4 border-[#2b7bb5] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                        PLAY AGAIN
                                    </button>
                                </div>
                            </div>
                        )}`;

// We need to replace the flex col area.
// Let's find the flex-col gap-4 mt-6 area
// The old code has:
/*
                        <div className="flex flex-col gap-4 mt-6 w-full">
                            {gameState === 'MENU' ? (
                                ['EASY', 'MEDIUM', 'HARD'].map(diff => (
                                    <div key={diff} className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => startGame(diff as Difficulty)} className={\`w-full border-4 border-[#4a4339] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] \${diff === 'EASY' ? 'bg-[#3ea0e6] text-white border-[#2b7bb5]' : 'bg-[#e4dfd7] text-[#554e44] border-[#c0bbb5]'}\`}>
                                            {diff}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                    <button onClick={() => startGame(difficulty)} className="w-full bg-[#3ea0e6] text-white border-4 border-[#2b7bb5] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                        PLAY AGAIN
                                    </button>
                                </div>
                            )}
                        </div>
*/

const oldButtonsBlock = `                        <div className="flex flex-col gap-4 mt-6 w-full">
                            {gameState === 'MENU' ? (
                                ['EASY', 'MEDIUM', 'HARD'].map(diff => (
                                    <div key={diff} className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => startGame(diff as Difficulty)} className={\`w-full border-4 border-[#4a4339] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] \${diff === 'EASY' ? 'bg-[#3ea0e6] text-white border-[#2b7bb5]' : 'bg-[#e4dfd7] text-[#554e44] border-[#c0bbb5]'}\`}>
                                            {diff}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                    <button onClick={() => startGame(difficulty)} className="w-full bg-[#3ea0e6] text-white border-4 border-[#2b7bb5] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                        PLAY AGAIN
                                    </button>
                                </div>
                            )}
                        </div>`;

const newButtonsBlock = `                        <div className="flex flex-col gap-4 mt-6 w-full">
                            {gameState === 'MENU' && (
                                ['EASY', 'MEDIUM', 'HARD'].map(diff => (
                                    <div key={diff} className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => startGame(diff as Difficulty)} className={\`w-full border-4 border-[#4a4339] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98] \${diff === 'EASY' ? 'bg-[#3ea0e6] text-white border-[#2b7bb5]' : 'bg-[#e4dfd7] text-[#554e44] border-[#c0bbb5]'}\`}>
                                            {diff}
                                        </button>
                                    </div>
                                ))
                            )}

                            {gameState === 'PAUSED' && (
                                <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                    <button onClick={() => setGameState('PLAYING')} className="w-full bg-[#3ea0e6] text-white border-4 border-[#2b7bb5] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                        CONTINUE
                                    </button>
                                </div>
                            )}

                            {(gameState === 'PAUSED' || gameState === 'GAME_OVER') && (
                                <>
                                    <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => startGame(difficulty)} className="w-full bg-[#e4dfd7] text-[#554e44] border-4 border-[#c0bbb5] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                            RESTART
                                        </button>
                                    </div>
                                    <div className="w-full bg-[#554e44] p-1.5 rounded shadow-inner border-2 border-[#4a4339]">
                                        <button onClick={() => setGameState('MENU')} className="w-full bg-[#ef4444] text-white border-4 border-[#b91c1c] rounded font-black text-xl py-2 uppercase shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                            HOME
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>`;

code = code.replace(oldButtonsBlock, newButtonsBlock);

// Freeze enemies and projectives when PAUSED
// Since EnemyNode runs in useFrame, we can freeze the animation by checking state!
// Wait, the user didn't explicitly ask for animation freeze, but if we want to pause background music:
code = code.replace(/setGameState\('PAUSED'\)/g, `() => { sfx.audioCtx?.suspend(); setGameState('PAUSED'); }`);
code = code.replace(/setGameState\('PLAYING'\)/g, `() => { sfx.resume(); setGameState('PLAYING'); }`);

fs.writeFileSync('app/typing-ninja/NinjaWorld.tsx', code);
console.log("Updated Pause Menu!");
