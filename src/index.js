import { h } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import './styles.css';

// custom hook that provides { width, height } of the window
const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener("resize", handleResize)
    handleResize()
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  return size
}

// constant for calculating the y coordinate of the next triangle layer
const dy = Math.sin(Math.PI / 2)

const Triangle = ({depth, num, x, y, width, height}) => {
  const w2 = width / 2
  if (depth <= 0) {
    /* eslint-disable react-hooks/rules-of-hooks */
    // in this case it is allowed to use hooks in an if-condition because depth is constant
    const [label, setLabel] = useState(num)
    useEffect(() => setLabel(num), [num])
    /* eslint-enable react-hooks/rules-of-hooks */
    return (
      <svg style={{position: "absolute", top: Math.trunc(y), left: Math.trunc(x - w2), width: Math.trunc(width), height: Math.trunc(height)}} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon className="triangle" points="50 0, 100 100, 0 100" vector-effect="non-scaling-stroke" />
        <text className="triangle-text" x="29" y="72" fill="FloralWhite">{label}</text>
      </svg>
    )
  }
    const w4 = width / 4, h2 = height / 2
    depth--
    return (
      <>
        <Triangle depth={depth} num={num} x={x} y={y} width={w2} height={h2} />
        <Triangle depth={depth} num={num} x={x - w4} y={y + dy * h2} width={w2} height={h2} />
        <Triangle depth={depth} num={num} x={x + w4} y={y + dy * h2} width={w2} height={h2} />
      </>
    )

}

// singular for i = 1 otherwise plural
const numerus = (i, s) => `${String(i)  } ${  i <= 1 ? s : `${s  }s`}`

// computes x, y, shrinked width and height given full width, height and a factor
const computeSize = (width, height, f) => ({ x: width / 2, y: 0, width: width * f, height })

// a sinus based movement, in: [0..1], out: [0..1]
const ease = t => (Math.sin(Math.PI * 2 * t) + 1) / 2

// power: x ^ y = z, power exponent: y = ln z / ln x, see https://math.stackexchange.com/a/1125315/834229
const pow_exp = (z, x) => Math.log(z) / Math.log(x)

// schedules a computation with a Promise if available, otherwise falls back to setTimeout
const schedule = typeof Promise === 'function' ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout

// Render the whole president table
const SierpinskiTriangle = () => {

  const { width, height } = useWindowSize()   // we react to browser window size changes
  const [depth, setDepth] = useState(4)       // Sierpinski triangle depth
  const [speed, setSpeed] = useState(50)     // the speed slider uses a logarithmic scale for better UX, see below
  const [factor, setFactor] = useState(1)     // shrink factor of triangle width
  const stats = useRef({
    fps: 60,
    millis: Date.now(),
    renders: 0
  })
  const components = Math.trunc((1 - Math.pow(3, Math.trunc(depth) + 1)) / (1 - 3)) // we have Sum_0..n(3^n) components, see https://en.wikipedia.org/wiki/Geometric_series

  // Animation loop by deferring state changes (here: setFactor), which perform a new component render.
  // Internally, each render is done on the browsers animation frame (requestAnimationFrame()), which runs every 16 ms (= 60 fps)
  useLayoutEffect(() => {
    schedule(() => requestAnimationFrame(() => {
      const { current } = stats
      const now = Date.now()
      current.renders++
      if (now - current.millis >= 1000) {
        current.millis = now
        current.fps = current.renders
        current.renders = 0
      }
      const nextFactor = ease((now / speed) % 100 / 100)
      setFactor(prevFactor => (prevFactor === nextFactor) ? nextFactor + 1e-9 : nextFactor) // prevent animation stop
    }))
  }, [factor]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div id="background" />
      <div id="stats">
        <div class="lib">
          <span class="lib-name">Preact</span>
          <span class="lib-version">10.3.2</span>
        </div>
        <div className="fps">{stats.current.fps} fps</div>
        <div className="stat">{width} x {height} px</div>
        <div className="stat">{numerus(components, 'component')}</div>
        <div className="stat">{numerus(components * 3, 'node')}</div>
      </div>
      <div id="controls">
        <div class="control">
          <div class="control-label">Depth</div>
          <div class="control-value">{depth}</div>
          <input class="control-range" type="range" min="0" max="8" step="1" value={depth} onInput={(e) => setDepth(e.target.value)} />
        </div>
        <div class="control">
          <div class="control-label">Speed</div>
          <div class="control-value">{Math.round(101 - pow_exp(speed, 1.08))}</div>
          <input class="control-range" type="range" min="1" max="100" step="1" value={101 - pow_exp(speed, 1.08)} onInput={(e) => setSpeed(Math.pow(1.08, 101 - e.target.value))} />
        </div>
      </div>
      <div id="triangle">
        {width * height > 0 && <Triangle depth={depth} num={Math.trunc(factor * 100)} {...computeSize(width, height, factor)} />}
      </div>
    </>
  )
}

// Entry point: mount president table to DOM
export default SierpinskiTriangle
