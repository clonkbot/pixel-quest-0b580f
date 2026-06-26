import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Text, Environment, MeshWobbleMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Game state interface
interface GameState {
  score: number
  gems: number
  health: number
  level: number
}

// Voxel block component
function VoxelBlock({
  position,
  color,
  scale = 1,
  emissive = false,
  emissiveIntensity = 0.5
}: {
  position: [number, number, number]
  color: string
  scale?: number
  emissive?: boolean
  emissiveIntensity?: number
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[scale, scale, scale]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ? color : '#000000'}
        emissiveIntensity={emissive ? emissiveIntensity : 0}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  )
}

// Player character made of voxels
function Player({
  position,
  onCollect
}: {
  position: THREE.Vector3
  onCollect: (type: 'gem' | 'coin') => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const [bobOffset, setBobOffset] = useState(0)

  useFrame((state) => {
    setBobOffset(Math.sin(state.clock.elapsedTime * 4) * 0.05)
    if (groupRef.current) {
      groupRef.current.position.y = position.y + bobOffset
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  // Body colors
  const bodyColor = '#00ff88'
  const eyeColor = '#ffffff'
  const pupilColor = '#1a1a2e'

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Body */}
      <VoxelBlock position={[0, 0, 0]} color={bodyColor} scale={0.8} emissive emissiveIntensity={0.3} />
      <VoxelBlock position={[0, 0.8, 0]} color={bodyColor} scale={0.8} emissive emissiveIntensity={0.3} />

      {/* Head */}
      <VoxelBlock position={[0, 1.6, 0]} color={bodyColor} scale={1} emissive emissiveIntensity={0.3} />

      {/* Eyes */}
      <VoxelBlock position={[-0.25, 1.7, 0.45]} color={eyeColor} scale={0.25} emissive emissiveIntensity={0.8} />
      <VoxelBlock position={[0.25, 1.7, 0.45]} color={eyeColor} scale={0.25} emissive emissiveIntensity={0.8} />
      <VoxelBlock position={[-0.25, 1.7, 0.55]} color={pupilColor} scale={0.15} />
      <VoxelBlock position={[0.25, 1.7, 0.55]} color={pupilColor} scale={0.15} />

      {/* Arms */}
      <VoxelBlock position={[-0.6, 0.6, 0]} color={bodyColor} scale={0.4} emissive emissiveIntensity={0.3} />
      <VoxelBlock position={[0.6, 0.6, 0]} color={bodyColor} scale={0.4} emissive emissiveIntensity={0.3} />

      {/* Legs */}
      <VoxelBlock position={[-0.25, -0.6, 0]} color={bodyColor} scale={0.35} emissive emissiveIntensity={0.3} />
      <VoxelBlock position={[0.25, -0.6, 0]} color={bodyColor} scale={0.35} emissive emissiveIntensity={0.3} />
    </group>
  )
}

// Collectible gem
function Gem({
  position,
  onCollect,
  color = '#ff00ff'
}: {
  position: [number, number, number]
  onCollect: () => void
  color?: string
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [collected, setCollected] = useState(false)

  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += 0.03
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  const handleClick = () => {
    if (!collected) {
      setCollected(true)
      onCollect()
    }
  }

  if (collected) return null

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        onPointerOver={(e) => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          document.body.style.cursor = 'default'
        }}
      >
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.9}
        />
      </mesh>
    </Float>
  )
}

// Collectible coin
function Coin({
  position,
  onCollect
}: {
  position: [number, number, number]
  onCollect: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [collected, setCollected] = useState(false)

  useFrame((state) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += 0.05
    }
  })

  const handleClick = () => {
    if (!collected) {
      setCollected(true)
      onCollect()
    }
  }

  if (collected) return null

  return (
    <Float speed={3} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh
        ref={meshRef}
        position={position}
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.08, 16]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffa500"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  )
}

// Ground tiles
function GroundTile({
  position,
  color
}: {
  position: [number, number, number]
  color: string
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[1, 0.2, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

// Generate procedural terrain
function Terrain() {
  const tiles: JSX.Element[] = []
  const colors = ['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e', '#16213e']

  for (let x = -10; x <= 10; x++) {
    for (let z = -10; z <= 10; z++) {
      const colorIndex = Math.abs((x + z) % colors.length)
      const height = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.3
      tiles.push(
        <GroundTile
          key={`${x}-${z}`}
          position={[x, height - 0.5, z]}
          color={colors[colorIndex]}
        />
      )
    }
  }

  return <>{tiles}</>
}

// Floating platform
function Platform({
  position,
  size = [3, 0.5, 3],
  color = '#4a00e0'
}: {
  position: [number, number, number]
  size?: [number, number, number]
  color?: string
}) {
  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
    </Float>
  )
}

// Tree made of voxels
function VoxelTree({ position }: { position: [number, number, number] }) {
  const trunkColor = '#4a2c2a'
  const leafColor = '#00cc66'

  return (
    <group position={position}>
      {/* Trunk */}
      <VoxelBlock position={[0, 0, 0]} color={trunkColor} scale={0.5} />
      <VoxelBlock position={[0, 0.5, 0]} color={trunkColor} scale={0.5} />
      <VoxelBlock position={[0, 1, 0]} color={trunkColor} scale={0.5} />

      {/* Leaves */}
      <VoxelBlock position={[0, 1.5, 0]} color={leafColor} scale={1.2} emissive emissiveIntensity={0.15} />
      <VoxelBlock position={[0, 2.5, 0]} color={leafColor} scale={0.9} emissive emissiveIntensity={0.2} />
      <VoxelBlock position={[0, 3.3, 0]} color={leafColor} scale={0.5} emissive emissiveIntensity={0.25} />
    </group>
  )
}

// Enemy blob
function Enemy({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 2) * 2
      meshRef.current.position.y = position[1] + Math.abs(Math.sin(state.clock.elapsedTime * 3)) * 0.5
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <MeshWobbleMaterial
        color="#ff3366"
        emissive="#ff0044"
        emissiveIntensity={0.5}
        factor={0.5}
        speed={3}
      />
    </mesh>
  )
}

// Particle effect
function Particles() {
  const particlesRef = useRef<THREE.Points>(null!)
  const particleCount = 200

  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30
    positions[i * 3 + 1] = Math.random() * 15
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#00ffff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// Main game scene
function GameScene({
  gameState,
  setGameState
}: {
  gameState: GameState
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}) {
  const playerPosition = new THREE.Vector3(0, 0.5, 0)

  const handleCollectGem = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gems: prev.gems + 1,
      score: prev.score + 100
    }))
  }, [setGameState])

  const handleCollectCoin = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + 25
    }))
  }, [setGameState])

  // Gem positions
  const gemPositions: [number, number, number][] = [
    [3, 2, 2],
    [-4, 1.5, 3],
    [5, 3, -3],
    [-3, 2.5, -4],
    [0, 4, 0],
    [6, 2, 5],
    [-5, 3, -2],
  ]

  const gemColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff3366', '#00ff88', '#ff8800', '#8800ff']

  // Coin positions
  const coinPositions: [number, number, number][] = [
    [2, 1, 0],
    [-2, 1, 0],
    [0, 1, 2],
    [0, 1, -2],
    [4, 1.5, 4],
    [-4, 1.5, -4],
    [3, 2, -2],
    [-3, 2, 2],
  ]

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#ff00ff" />
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#ffff00" />

      {/* Environment */}
      <Stars radius={50} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1} />
      <fog attach="fog" args={['#0a0a15', 10, 50]} />

      {/* Terrain */}
      <Terrain />

      {/* Platforms */}
      <Platform position={[4, 1, 0]} size={[2, 0.3, 2]} color="#4a00e0" />
      <Platform position={[-4, 1.5, 0]} size={[2, 0.3, 2]} color="#e000a0" />
      <Platform position={[0, 2, 4]} size={[2, 0.3, 2]} color="#00e0a0" />
      <Platform position={[0, 3, -4]} size={[2, 0.3, 2]} color="#a0e000" />
      <Platform position={[5, 2.5, -3]} size={[1.5, 0.3, 1.5]} color="#00a0e0" />
      <Platform position={[-5, 2, -3]} size={[1.5, 0.3, 1.5]} color="#e0a000" />

      {/* Trees */}
      <VoxelTree position={[7, 0, 7]} />
      <VoxelTree position={[-7, 0, -7]} />
      <VoxelTree position={[7, 0, -7]} />
      <VoxelTree position={[-7, 0, 7]} />
      <VoxelTree position={[-8, 0, 0]} />
      <VoxelTree position={[8, 0, 0]} />

      {/* Player */}
      <Player position={playerPosition} onCollect={handleCollectGem} />

      {/* Gems */}
      {gemPositions.map((pos, index) => (
        <Gem
          key={`gem-${index}`}
          position={pos}
          color={gemColors[index % gemColors.length]}
          onCollect={handleCollectGem}
        />
      ))}

      {/* Coins */}
      {coinPositions.map((pos, index) => (
        <Coin
          key={`coin-${index}`}
          position={pos}
          onCollect={handleCollectCoin}
        />
      ))}

      {/* Enemies */}
      <Enemy position={[5, 1, 0]} />
      <Enemy position={[-5, 1, 3]} />
      <Enemy position={[3, 1.5, -5]} />

      {/* Particles */}
      <Particles />

      {/* 3D Title */}
      <Text
        position={[0, 8, 0]}
        fontSize={1.5}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#ff00ff"
      >
        PIXEL QUEST
      </Text>

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 1, 0]}
      />
    </>
  )
}

// Loading screen
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a15] via-[#1a1a2e] to-[#0a0a15] flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cyan-400 font-mono text-lg tracking-widest animate-pulse">LOADING...</p>
      </div>
    </div>
  )
}

// HUD component
function HUD({ gameState }: { gameState: GameState }) {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 md:p-6 pointer-events-none z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 max-w-7xl mx-auto">
        {/* Score */}
        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/50 rounded-lg px-4 py-2 md:px-6 md:py-3 shadow-lg shadow-cyan-500/20">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-yellow-400 text-xl md:text-2xl">★</span>
            <span className="text-cyan-400 font-mono text-xl md:text-2xl font-bold tracking-wider">
              {gameState.score.toString().padStart(6, '0')}
            </span>
          </div>
        </div>

        {/* Gems counter */}
        <div className="bg-black/60 backdrop-blur-md border border-fuchsia-500/50 rounded-lg px-4 py-2 md:px-6 md:py-3 shadow-lg shadow-fuchsia-500/20">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-fuchsia-400 text-xl md:text-2xl">◆</span>
            <span className="text-fuchsia-400 font-mono text-xl md:text-2xl font-bold">
              {gameState.gems} / 7
            </span>
          </div>
        </div>

        {/* Level indicator */}
        <div className="bg-black/60 backdrop-blur-md border border-lime-500/50 rounded-lg px-4 py-2 md:px-6 md:py-3 shadow-lg shadow-lime-500/20">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-lime-400 font-mono text-base md:text-lg uppercase tracking-widest">
              Level {gameState.level}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Instructions panel
function Instructions() {
  const [showInstructions, setShowInstructions] = useState(true)

  if (!showInstructions) return null

  return (
    <div className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-[calc(100%-2rem)] md:w-auto">
      <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 md:p-6 max-w-md shadow-2xl shadow-cyan-500/10">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-cyan-400 font-mono text-base md:text-lg tracking-wider uppercase">How to Play</h3>
          <button
            onClick={() => setShowInstructions(false)}
            className="text-gray-500 hover:text-white transition-colors text-2xl leading-none p-1 -m-1"
          >
            ×
          </button>
        </div>
        <ul className="text-gray-300 text-xs md:text-sm space-y-2 font-mono">
          <li className="flex items-center gap-2">
            <span className="text-yellow-400">●</span>
            <span>Drag/Touch to rotate view</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-fuchsia-400">●</span>
            <span>Scroll/Pinch to zoom in/out</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-cyan-400">●</span>
            <span>Click gems and coins to collect</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-lime-400">●</span>
            <span>Collect all 7 gems to win!</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

// Win screen
function WinScreen({ score, onRestart }: { score: number; onRestart: () => void }) {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30 p-4">
      <div className="text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400 mb-4 md:mb-6 font-mono tracking-wider animate-pulse">
          VICTORY!
        </h1>
        <p className="text-gray-300 text-lg md:text-xl mb-2 font-mono">All gems collected!</p>
        <p className="text-yellow-400 text-2xl md:text-3xl mb-6 md:mb-8 font-mono">
          Final Score: {score.toString().padStart(6, '0')}
        </p>
        <button
          onClick={onRestart}
          className="px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-mono text-base md:text-lg rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    gems: 0,
    health: 100,
    level: 1
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleRestart = () => {
    setGameState({
      score: 0,
      gems: 0,
      health: 100,
      level: 1
    })
    window.location.reload()
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a15] relative overflow-hidden">
      {/* CRT scanline effect overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          mixBlendMode: 'multiply'
        }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {isLoading && <LoadingScreen />}

      <HUD gameState={gameState} />

      <Instructions />

      {gameState.gems >= 7 && (
        <WinScreen score={gameState.score} onRestart={handleRestart} />
      )}

      <Canvas
        shadows
        camera={{ position: [8, 8, 8], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #0a0a15, #1a1a2e)' }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <GameScene gameState={gameState} setGameState={setGameState} />
        </Suspense>
      </Canvas>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-2 md:py-3 text-center z-20">
        <p className="text-gray-600 text-[10px] md:text-xs font-mono tracking-wider">
          Requested by <a href="https://twitter.com/Vox_Claw_" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-cyan-400 transition-colors">@Vox_Claw_</a> · Built by <a href="https://twitter.com/clonkbot" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-fuchsia-400 transition-colors">@clonkbot</a>
        </p>
      </footer>
    </div>
  )
}
