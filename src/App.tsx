import React, { useState, useEffect } from 'react';
import './App.css';
import { Stage, Layer, Rect, Shape } from 'react-konva'
import { Context } from 'konva/types/Context';

type InputProps = {
  label: string,
  update: (n: number) => void,
  initial: number
}

const Input: React.FC<InputProps> = ({ label, update, initial }) => {
  return (
    <div>{label}: <input type="number" title={label} onChange={e => update(((e.target.value || 0) as any))} value={initial} /></div>
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

const Preview: React.FC<Settings> = ({ period, amplitude, phase, noise }) => {
  const screenWidth = Math.min(useWindowWidth(), 1000)
  const screenHeight = 400

  const background = <Layer>
    <Rect width={screenWidth} height={screenHeight}></Rect>
  </Layer>

  function drawSine(context: Context) {

    context.moveTo(0, screenHeight / period)
    context.beginPath()

    for (let arg = 0; arg < (screenWidth || 0); arg++) {
      const base = Math.sin((arg / period) - phase) * amplitude
      const noiseValue = arg % noise.rate < 1 ? Math.random() * noise.factor - noise.factor / 2 : 0

      const v = base + noiseValue * base / screenHeight

      context.lineTo(arg, -v + screenHeight / 2)
    }
  }

  const wave = <Shape sceneFunc={(context, shape) => {
    drawSine(context)
    context.fillStrokeShape(shape)
  }} stroke="#09d3ac" strokeWidth={1} />

  return <Stage width={screenWidth} height={screenHeight} >
    {background}
    <Layer>{wave}</Layer>
  </Stage >
}

type Noise = { factor: number, rate: number }

const Comp: React.FC = () => {
  const [period, setPeriod] = useState(10)
  const [amplitude, setAmplitude] = useState(50)
  const [phase, setPhase] = useState(0)
  const [noiseFactor, setNoiseFactor] = useState(100)
  const [noiseRate, setNoiseRate] = useState(5)

  const noise: Noise = { factor: noiseFactor, rate: noiseRate }

  return (
    <div>
      <Preview {...{ period, amplitude, phase, noise }}></Preview>
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
