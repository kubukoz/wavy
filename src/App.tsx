import React, { useState, useEffect } from 'react';
import './App.css';
import { Stage, Layer, Rect, Shape } from 'react-konva'
import { Context } from 'konva/types/Context';
import axios from 'axios'

type InputProps = {
  label: string,
  update: (n: number) => void,
  initial: number
}

const Input: React.FC<InputProps> = ({ label, update, initial }) => {
  return (
    <div>{label}: <input type="number" title={label} onChange={e => update(((+e.target.value || 0)))} value={initial} /></div>
  )
}

type Settings = { period: number, amplitude: number, phase: number, noise: Noise }

const useWindowWidth = () => {
  const [get, set] = useState<number>(window.innerWidth)

  useEffect(() => {
    window.addEventListener(
      "resize",
      () => set(window.innerWidth)
    )
  })

  return get
}

function append<T>(maxLength: number, elems: Array<T>) {
  return (buffer: Array<T>) => {
    return buffer.concat(elems).slice(-maxLength)
  }
}

type Sample = {
  value: number
}

const useUpdateSettings: (s: Settings) => void = (settings) => {
  useEffect(() => {
    (async () => {
      await axios.put("http://localhost:4000/params", settings)

      console.log("updated params")
    })()
  }, [settings.amplitude, settings.noise.factor, settings.noise.rate, settings.period, settings.phase])

}

function drawSine(samples: Array<Sample>, context: Context, screen: Screen) {

  const sampleCountToDraw = samples.length

  console.log(`Drawing ${sampleCountToDraw} samples`)

  for (let arg = 0; arg < sampleCountToDraw; arg++) {
    const v = samples[arg]
    if (arg === 0) {
      context.moveTo(0, v)
      context.beginPath()
    }

    context.lineTo(arg, -v.value + screen.height / 2)
  }
}

type Screen = {
  height: number,
  width: number
}

type PreviewState = { samples: Array<Sample>, screen: Screen }

const Preview: React.FC<PreviewState> = ({ samples, screen }) => {
  const background = <Layer>
    <Rect width={screen.width} height={screen.height}></Rect>
  </Layer>

  const wave = <Shape sceneFunc={(context, shape) => {
    drawSine(samples, context, screen)
    context.fillStrokeShape(shape)
  }} stroke="#09d3ac" strokeWidth={1} />

  return <Stage width={screen.width} height={screen.height} >
    {background}
    <Layer>{wave}</Layer>
  </Stage >
}

type Noise = { factor: number, rate: number }

const Comp: React.FC = () => {
  const screen: Screen = {
    width: Math.min(useWindowWidth(), 1000),
    height: 400
  }

  const [samples, setSamples] = useState<Array<Sample>>([])

  const [period, setPeriod] = useState(10)
  const [amplitude, setAmplitude] = useState(50)
  const [phase, setPhase] = useState(0)
  const [noiseFactor, setNoiseFactor] = useState(100)
  const [noiseRate, setNoiseRate] = useState(5)

  const noise: Noise = { factor: noiseFactor, rate: noiseRate }

  const settings: Settings = { period, amplitude, phase, noise }

  useUpdateSettings(settings)

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000/samples")

    ws.onmessage = ev => {
      const decoded = JSON.parse(ev.data) as Array<number>
      const samples = decoded.map(s => ({ value: s }))

      setSamples(append(screen.width, samples))
    }

    return () => ws.close()
  }, [screen.width])

  return (
    <div>
      <Preview samples={samples} screen={screen} />
      <Input label="Period" update={setPeriod} initial={period}></Input>
      <Input label="Amplitude" update={setAmplitude} initial={amplitude}></Input>
      <Input label="Phase" update={setPhase} initial={phase}></Input>
      <Input label="Noise rate" update={setNoiseRate} initial={noiseRate}></Input>
      <Input label="Noise factor" update={setNoiseFactor} initial={noiseFactor}></Input>
      Settings: Period {period} amp {amplitude} phase {phase} noise ±{noise.factor} /{noise.rate}x
    </div >
  )
}

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <Comp />
      </header>
    </div>
  );
}

export default App;
