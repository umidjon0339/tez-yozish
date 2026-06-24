const fs = require('fs');
let code = fs.readFileSync('app/typing-ninja/NinjaWorld.tsx', 'utf8');

// 1. Add isMuted state
code = code.replace(/const \[gameState, setGameState\] = useState<GameState>\("MENU"\);/,
    \`const [gameState, setGameState] = useState<GameState>("MENU");
    const [isMuted, setIsMuted] = useState(sfx.muted);\`);

// 2. Pass isPaused to EnemyNode
code = code.replace(/<EnemyNode key=\{id\} enemyId=\{id\} stateRef=\{stateRef\} \/>/g, 
    \`<EnemyNode key={id} enemyId={id} stateRef={stateRef} isPaused={gameState !== 'PLAYING'} />\`);

// 3. Update EnemyNode props and usage
code = code.replace(/const EnemyNode = \(\{ enemyId, stateRef \}: any\) => \{/,
    \`const EnemyNode = ({ enemyId, stateRef, isPaused }: any) => {\`);

code = code.replace(/wordTag=\{textState\.show && \(/,
    \`wordTag={!isPaused && textState.show && (\`);

// 4. Update mute button to toggle state and icon
const oldMuteButton = \`<button onClick={() => { sfx.toggleMute(); }} className="absolute -top-4 -right-4 bg-[#7a6f61] text-white border-[3px] border-[#554e44] w-12 h-12 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-2xl z-10">
                            🔇
                        </button>\`;

const newMuteButton = \`<button onClick={() => { setIsMuted(sfx.toggleMute()); }} className="absolute -top-4 -right-4 bg-[#7a6f61] text-white border-[3px] border-[#554e44] w-12 h-12 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-2xl z-10">
                            {isMuted ? '🔇' : '🔊'}
                        </button>\`;

code = code.replace(oldMuteButton, newMuteButton);

fs.writeFileSync('app/typing-ninja/NinjaWorld.tsx', code);
console.log("Fixed pause issues");
