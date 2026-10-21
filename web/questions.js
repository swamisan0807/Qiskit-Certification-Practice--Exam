// Question bank for the practice exam.
// This file is the single source of truth: the web app reads it directly and
// scripts/build-markdown.js turns it into practice-exam.md.
//
// Every code snippet was run against Qiskit 2.5 before it went in here.
// `answer` is the zero-based index of the correct option.
//
// `anim` describes the animated walkthrough shown after the answer is revealed
// (see anim.js for the scene types). Circuit gates are written as
//   ["h", q]  ["rz", q, angle, "label"]  ["cx", control, target]
//   ["measure", q, clbit]  ["if", clbit, value, gate]  ["barrier"]
// and are simulated live, so the states on screen come from the gates.

const PI = Math.PI;

window.SECTIONS = [
  { id: 1, name: "Perform quantum operations" },
  { id: 2, name: "Visualize circuits, measurements, and states" },
  { id: 3, name: "Create quantum circuits" },
  { id: 4, name: "Run quantum circuits" },
  { id: 5, name: "Use the Sampler primitive" },
  { id: 6, name: "Use the Estimator primitive" },
  { id: 7, name: "Retrieve and analyze results" },
  { id: 8, name: "Operate with OpenQASM" },
];

window.QUESTIONS = [
  // ---------------------------------------------------------------- Section 1
  {
    section: 1,
    q: "You're writing the observable for a three-qubit sensor experiment and type `Pauli('XYZ')`. Which qubit does the X act on?",
    options: ["Qubit 0", "Qubit 1", "Qubit 2", "All three qubits, one after another"],
    answer: 2,
    explain: "Qiskit labels are little-endian, so you read them right to left: Z is on qubit 0, Y on qubit 1 and X on qubit 2. You can check it yourself, since `Pauli('XYZ')[0]` returns `Pauli('Z')`. Textbooks usually write qubit 0 first, so this catches a lot of people.",
    anim: {
      type: "order",
      text: "XYZ",
      notes: [
        "The label is a string, but its characters don't map to qubits left to right.",
        "The last character, Z, belongs to qubit 0.",
        "The middle character, Y, belongs to qubit 1.",
        "The first character, X, belongs to qubit 2. The arrows cross because the label is written backwards relative to the qubit numbers.",
      ],
    },
  },
  {
    section: 1,
    q: "What single gate is this circuit equivalent to?",
    code: `qc = QuantumCircuit(1)
qc.h(0)
qc.z(0)
qc.h(0)`,
    options: ["X", "Z", "Y", "Identity"],
    answer: 0,
    explain: "H swaps the X and Z bases, so a Z sandwiched between two H gates acts as an X. `Operator(qc).equiv(Operator(XGate()))` returns `True`. The same trick works the other way round: on hardware whose native two-qubit gate is CZ, a CX is just a CZ with an H on either side of the target.",
    anim: {
      type: "circuit", n: 1, view: "bloch",
      title: "Follow the arrow on the Bloch sphere",
      gates: [["h", 0], ["z", 0], ["h", 0]],
      notes: [
        "Start in |0⟩, at the north pole.",
        "H swings the arrow down to |+⟩, on the X axis.",
        "Z turns it half a turn around the vertical axis, to |−⟩.",
        "H again takes |−⟩ to |1⟩, the south pole. That's exactly where a single X would have sent |0⟩.",
      ],
    },
  },
  {
    section: 1,
    q: "What does this print?",
    code: `from math import pi
from qiskit.circuit.library import RZGate, ZGate
from qiskit.quantum_info import Operator

a = Operator(RZGate(pi))
b = Operator(ZGate())
print(a == b, a.equiv(b))`,
    options: ["True True", "False False", "True False", "False True"],
    answer: 3,
    explain: "RZ(π) is diag(−i, i), which is −i·Z. The two matrices are not equal, so `==` gives `False`. They differ only by a global phase, though, and `equiv` ignores global phase, so it gives `True`. Global phase never shows up in measurement results, which is why the transpiler can swap one gate for the other.",
    anim: {
      type: "circuit", n: 1, view: ["bloch", "amps"],
      gates: [["h", 0], ["rz", 0, PI, "π"]],
      notes: [
        "Start in |0⟩.",
        "H gives |+⟩. Both amplitudes are +0.71.",
        "RZ(π) lands on |−⟩, with amplitudes −0.71i and +0.71i. Z would give +0.71 and −0.71 instead. Each amplitude is multiplied by the same factor, −i. The arrow, the probabilities and the relative phase are all identical: only the global phase differs, so `==` says False and `equiv` says True.",
      ],
    },
  },
  {
    section: 1,
    q: "What does this print?",
    code: `qc = QuantumCircuit(2)
qc.x(0)
qc.h(1)
print(Statevector(qc).probabilities_dict())`,
    options: ["{'10': 0.5, '11': 0.5}", "{'01': 0.5, '11': 0.5}", "{'00': 0.5, '01': 0.5}", "{'01': 1.0}"],
    answer: 1,
    explain: "Qubit 0 is always 1, and it is the rightmost character. Qubit 1 is in an equal superposition, so the leftmost character is 0 or 1 with equal odds. That gives '01' and '11'. If you picked {'10': 0.5, '11': 0.5}, you read the string with qubit 0 on the left. (The actual printout shows 0.4999999999999999 because of floating-point rounding.)",
    anim: {
      type: "circuit", n: 2, view: "amps",
      gates: [["x", 0], ["h", 1]],
      notes: [
        "Both qubits start in 0, so all the probability sits on '00'.",
        "X flips qubit 0. Qubit 0 is the rightmost character, so the bar moves to '01'.",
        "H puts qubit 1, the leftmost character, into superposition. The bar splits evenly between '01' and '11'.",
      ],
    },
  },
  {
    section: 1,
    q: "You're estimating what a circuit would cost on future error-corrected hardware, where some gates are cheap and others are very expensive. Which of these is not a Clifford gate?",
    options: ["H", "S", "CX", "T"],
    answer: 3,
    explain: "Clifford gates map Pauli operators to other Pauli operators, and a circuit made only of them can be simulated efficiently on a classical computer (the Gottesman–Knill theorem). T is the standard non-Clifford gate. In fault-tolerant schemes it needs magic-state distillation, which is why resource estimates usually quote a T-count.",
    anim: {
      type: "circuit", n: 1, view: "bloch",
      title: "Clifford gates jump between axes, T doesn't",
      gates: [["h", 0], ["s", 0], ["t", 0]],
      notes: [
        "Start at |0⟩, which sits on an axis.",
        "H, a Clifford gate, moves it to another axis point, |+⟩.",
        "S, also Clifford, is a quarter turn to |+i⟩. Still on an axis.",
        "T is an eighth of a turn. The arrow stops between two axes, at a point no combination of Clifford gates can reach from |0⟩. That's what makes T non-Clifford, and expensive on error-corrected hardware.",
      ],
    },
  },
  {
    section: 1,
    q: "Logical qubits 0 and 4 need to interact, but they aren't neighbours on the chip, so the router inserts a SWAP. If the native entangling gate is CX, how many CX gates does one SWAP cost?",
    options: ["1", "2", "3", "4"],
    answer: 2,
    explain: "SWAP = CX(0,1) · CX(1,0) · CX(0,1). Transpiling a lone `swap` with `basis_gates=['cx', 'u']` gives exactly `{'cx': 3}`. Two-qubit gates are the noisiest operations on today's devices, so a bad initial layout gets expensive fast.",
    anim: {
      type: "circuit", n: 2, view: "amps",
      title: "Three CX gates move a 1 from qubit 0 to qubit 1",
      gates: [["x", 0], ["cx", 0, 1], ["cx", 1, 0], ["cx", 0, 1]],
      notes: [
        "Start at '00'.",
        "Prepare a test input: X on qubit 0 gives '01'.",
        "CX(0,1): qubit 0 is 1, so qubit 1 flips. Now '11'.",
        "CX(1,0): qubit 1 is 1, so qubit 0 flips. Now '10'.",
        "CX(0,1): qubit 0 is now 0, so nothing happens. The 1 has moved from qubit 0 to qubit 1. That's a SWAP, and it took three CX gates.",
      ],
    },
  },
  {
    section: 1,
    q: "Which statement is true?",
    options: [
      "`cx(0, 1)` and `cx(1, 0)` are the same operator",
      "`cz(0, 1)` and `cz(1, 0)` are the same operator",
      "A CZ entangles |00⟩ with no other gates needed",
      "A SWAP can be built from a single CZ",
    ],
    answer: 1,
    explain: "CZ only puts a −1 phase on |11⟩, so it doesn't matter which qubit you call the control. CX is not symmetric. On |00⟩ a CZ does nothing at all, because you need a superposition first. A SWAP needs three two-qubit gates, not one.",
    anim: {
      type: "circuit", n: 2, view: "amps",
      title: "What CZ actually does",
      gates: [["h", 0], ["h", 1], ["cz", 0, 1]],
      notes: [
        "At '00', a CZ would do nothing at all, so first spread the state out.",
        "H on qubit 0.",
        "H on qubit 1. All four states are equally likely, and every phase dial points right (+).",
        "CZ flips the sign of '11' and nothing else (watch its dial swing to −). '11' reads the same whichever qubit you call the control, so cz(0, 1) and cz(1, 0) are the same gate.",
      ],
    },
  },
  {
    section: 1,
    q: "What is the value of `sv.expectation_value(Pauli('X'))`?",
    code: `sv = Statevector.from_label("-")`,
    options: ["+1", "0", "−1", "0.5"],
    answer: 2,
    explain: "|−⟩ is the −1 eigenstate of X. In practice you'll see something like `-0.9999999999999998` because of floating-point rounding, which you should treat as −1. The Z expectation value of the same state is 0.",
    anim: {
      type: "circuit", n: 1, view: "bloch",
      title: "Expectation value = the arrow's shadow on an axis",
      gates: [["x", 0], ["h", 0]],
      notes: [
        "Start at |0⟩. ⟨Z⟩ = +1 because the arrow points straight up.",
        "X: now |1⟩, so ⟨Z⟩ = −1.",
        "H takes |1⟩ to |−⟩, which points straight along −X. Its shadow on the X axis is the whole length in the negative direction, so ⟨X⟩ = −1. Its shadow on Z is zero, so ⟨Z⟩ = 0.",
      ],
    },
  },
  {
    section: 1,
    q: "You're modelling a 4-site spin chain with a next-nearest-neighbour coupling between sites 1 and 3. Which dense Pauli label does this produce?",
    code: `SparsePauliOp.from_sparse_list([("ZZ", [1, 3], 1.0)], num_qubits=4)`,
    options: ["ZIZI", "IZIZ", "ZZII", "IIZZ"],
    answer: 0,
    explain: "`from_sparse_list` puts a Z on qubits 1 and 3. A dense label has qubit 3 on the far left and qubit 0 on the far right, so you get Z I Z I. IZIZ is the same mistake as in the `Pauli('XYZ')` question: reading the label with qubit 0 on the left.",
    anim: {
      type: "order",
      text: "ZIZI",
      highlight: [1, 3],
      notes: [
        "The sparse form says: Z on qubits 1 and 3, and identity everywhere else. Here's the dense label it produces.",
        "Qubit 0 gets the last character: I.",
        "Qubit 1 gets a Z.",
        "Qubit 2 gets an I.",
        "Qubit 3 gets the first character: Z. Read left to right, that's ZIZI.",
      ],
    },
  },
  {
    section: 1,
    q: "Hardware only measures in the computational (Z) basis. You want to know whether a qubit is in |+⟩ or |−⟩. What do you add just before `measure`?",
    options: ["An X gate", "A Z gate", "A barrier", "An H gate"],
    answer: 3,
    explain: "H maps |+⟩ to |0⟩ and |−⟩ to |1⟩, so H followed by a Z measurement is an X-basis measurement. For the Y basis you would add `sdg` and then `h`. The Estimator does this rotation for you behind the scenes whenever you ask for X or Y terms.",
    anim: {
      type: "circuit", n: 1, view: "bloch",
      title: "Rotate the question onto the axis you can measure",
      gates: [["x", 0], ["h", 0], ["h", 0]],
      notes: [
        "Start at |0⟩.",
        "Prepare a test state. X first...",
        "...then H gives |−⟩. A Z measurement now gives 0 or 1 with 50/50 odds, which tells you nothing.",
        "Add H just before measuring: |−⟩ turns onto |1⟩. Now a Z measurement gives 1 every time. Afterwards, 1 means it was |−⟩ and 0 means it was |+⟩.",
      ],
    },
  },

  // ---------------------------------------------------------------- Section 2
  {
    section: 2,
    q: "Which of these is not a valid `output` value for `QuantumCircuit.draw()`?",
    options: ["\"text\"", "\"mpl\"", "\"latex_source\"", "\"html\""],
    answer: 3,
    explain: "The supported outputs are `text`, `mpl`, `latex` and `latex_source`. `mpl` needs matplotlib installed. `latex` needs a working LaTeX install, while `latex_source` just gives you the .tex code to paste into a paper.",
    anim: {
      type: "steps", layout: "list",
      items: [
        { t: "draw('text')", s: "ASCII art. Works anywhere, even in a plain terminal", mark: "ok" },
        { t: "draw('mpl')", s: "a matplotlib figure, needs matplotlib", mark: "ok" },
        { t: "draw('latex')", s: "a rendered image, needs LaTeX installed", mark: "ok" },
        { t: "draw('latex_source')", s: "the .tex source as a string", mark: "ok" },
        { t: "draw('html')", s: "not an option, so it raises an error", mark: "bad" },
      ],
    },
  },
  {
    section: 2,
    q: "You prepare a Bell state and call `plot_bloch_multivector(Statevector(bell))`. What do you see?",
    options: [
      "Both arrows point to +Z",
      "Both arrows point to +X",
      "No visible arrow on either sphere, because each qubit's Bloch vector has length zero",
      "One arrow up, one arrow down",
    ],
    answer: 2,
    explain: "`plot_bloch_multivector` draws each qubit's reduced state on its own sphere. In a maximally entangled state, each qubit on its own is maximally mixed, so its vector sits at the centre. The lesson is that Bloch spheres can't show entanglement. Use `plot_state_city` or `plot_state_qsphere` when you need the full state.",
    anim: {
      type: "circuit", n: 2, view: "bloch",
      title: "Watch the arrows shrink as the qubits entangle",
      gates: [["h", 0], ["cx", 0, 1]],
      notes: [
        "Two independent qubits, both pointing at |0⟩.",
        "H on qubit 0 swings its arrow to +X. Qubit 1 hasn't moved.",
        "CX entangles them, and both arrows shrink to the centre. Neither qubit has a state of its own any more: the information now lives in the correlations between them, and a Bloch sphere has no way to draw that.",
      ],
    },
  },
  {
    section: 2,
    q: "After transpiling for a 127-qubit device, a reviewer asks which physical qubits your 5-qubit circuit landed on, shown on the chip's connectivity graph. Which call gives that picture?",
    options: [
      "`plot_circuit_layout(isa_circuit, backend)`",
      "`plot_gate_map(backend)`",
      "`plot_histogram(counts)`",
      "`plot_state_qsphere(sv)`",
    ],
    answer: 0,
    explain: "`plot_circuit_layout` needs the transpiled circuit, because that's where the layout is stored, plus the backend. It then highlights the qubits you used. `plot_gate_map` draws the chip on its own, without any of your mapping.",
    anim: {
      type: "map",
      title: "What plot_circuit_layout shows",
      left: { title: "your circuit", items: ["q0", "q1", "q2", "q3", "q4"] },
      right: { title: "device (a corner of it)", cols: 7, count: 28 },
      links: [{ from: 0, to: 8 }, { from: 1, to: 9 }, { from: 2, to: 10 }, { from: 3, to: 16 }, { from: 4, to: 17 }],
      notes: [
        "During transpilation, each virtual qubit was given a physical home on the chip. `plot_circuit_layout` draws those choices.",
        "q0 → physical 8",
        "q1 → physical 9",
        "q2 → physical 10",
        "q3 → physical 16",
        "q4 → physical 17. The transpiler picked a connected patch, so your CX gates need few SWAPs.",
      ],
    },
  },
  {
    section: 2,
    q: "What does `qc.draw('mpl', reverse_bits=True)` change?",
    options: [
      "It permanently reverses the qubit order in `qc`",
      "Only the picture: the highest-index qubit is drawn at the top",
      "The measurement results come back reversed",
      "Gates are drawn right to left",
    ],
    answer: 1,
    explain: "Drawing options are cosmetic. People use `reverse_bits=True` to match textbook diagrams that put the most significant qubit on top. If you really want a circuit with reversed qubits, `qc.reverse_bits()` returns a new circuit, and that is a different thing.",
    anim: {
      type: "circuit", n: 3, view: [], flip: true,
      title: "Same circuit, flipped drawing",
      gates: [["h", 0], ["cx", 0, 1], ["x", 2]],
      notes: [
        "The default drawing puts q0 on top.",
        "With `reverse_bits=True`, q2 is on top. Every gate is still on the same qubit. H is still on q0 and X is still on q2. Only the picture moved.",
      ],
    },
  },
  {
    section: 2,
    q: "You've reconstructed a `DensityMatrix` from tomography and want 3D bar charts of the real and imaginary parts of every element, to check whether the off-diagonal coherences survived. Which function?",
    options: ["`plot_state_city`", "`plot_bloch_vector`", "`plot_distribution`", "`plot_error_map`"],
    answer: 0,
    explain: "`plot_state_city` draws two 3D bar charts, one for the real part and one for the imaginary part. The diagonal holds populations and the off-diagonals hold coherences. Decoherence shows up as the off-diagonal bars shrinking. `plot_state_hinton` shows the same information as 2D squares.",
    anim: {
      type: "matrix",
      title: "A Bell state's density matrix, decohering",
      labels: ["00", "01", "10", "11"],
      values: [[0.5, 0, 0, 0.5], [0, 0, 0, 0], [0, 0, 0, 0], [0.5, 0, 0, 0.5]],
      notes: [
        "The 16 elements of a 2-qubit density matrix. Each square's size shows how big that element is.",
        "A clean Bell state. The populations are on the diagonal at 00 and 11, and the coherences are in the far corners.",
        "Some decoherence: the corner squares shrink. The diagonal doesn't change, so a counts histogram wouldn't notice anything.",
        "Mostly decohered. This is now close to a plain 50/50 classical mix of 00 and 11. `plot_state_city` makes this loss obvious at a glance.",
      ],
    },
  },
  {
    section: 2,
    q: "Before spending QPU time, you want to steer clear of qubits with poor readout and links with bad two-qubit fidelity. Which visualization shows error rates laid out on the device graph?",
    options: ["`plot_bloch_multivector`", "`plot_state_paulivec`", "`plot_error_map(backend)`", "`qc.draw('text')`"],
    answer: 2,
    explain: "`plot_error_map` colours qubits and couplers by the error rates in the backend's calibration data. Devices are recalibrated regularly, so check it on the day you run, not the week before.",
    anim: {
      type: "bars", format: "pct",
      title: "Readout error per qubit (the numbers plot_error_map colours in)",
      series: [{ name: "readout error", data: { q0: 0.012, q1: 0.045, q2: 0.008, q3: 0.021, q4: 0.067, q5: 0.01, q6: 0.015 } }],
      highlight: ["q2", "q5", "q0"],
      notes: [
        "Today's calibration data for seven qubits.",
        "The readout error for each one. `plot_error_map` paints these onto the chip layout, along with the two-qubit gate errors on each link.",
        "These three are the ones to use today. After tomorrow's recalibration the best ones may be different.",
      ],
    },
  },
  {
    section: 2,
    q: "You have counts from an ideal simulator and from hardware, and you want them as grouped bars in one chart. What works?",
    code: `plot_histogram([ideal_counts, hw_counts], legend=["ideal", "hardware"])`,
    options: [
      "This works: `plot_histogram` takes a list of count dicts and a legend",
      "You have to merge the dicts into one first",
      "`plot_histogram` only accepts a Statevector",
      "Only `plot_state_city` can compare two runs",
    ],
    answer: 0,
    explain: "`plot_histogram` takes either one dict or a list of them and draws grouped bars, which makes noise easy to see. If the two runs used different shot counts, `plot_distribution` normalises everything to probabilities, so the comparison is fair.",
    anim: {
      type: "bars",
      series: [
        { name: "ideal", data: { "00": 512, "01": 0, "10": 0, "11": 512 } },
        { name: "hardware", data: { "00": 478, "01": 31, "10": 42, "11": 473 } },
      ],
      highlight: ["01", "10"],
      notes: [
        "Two dicts, one chart.",
        "Each bitstring gets a pair of bars: ideal on the left, hardware on the right.",
        "The short bars at 01 and 10 are the noise. Side by side, you can see it straight away.",
      ],
    },
  },

  // ---------------------------------------------------------------- Section 3
  {
    section: 3,
    q: "What does `qc.measure_all()` do on a 3-qubit circuit with no classical bits?",
    options: [
      "Measures into the default register `c`",
      "Adds a barrier, adds a new 3-bit classical register called `meas`, and measures every qubit into it",
      "Marks the qubits so they get measured at runtime",
      "Measures every qubit and then resets it",
    ],
    answer: 1,
    explain: "This is why Sampler results for these circuits sit under `data.meas`. If you only want to measure qubits that actually have gates on them, use `measure_active()`.",
    anim: {
      type: "registers",
      qubits: 3, cregs: [], add: { name: "meas", size: 3 },
      notes: [
        "Three qubits with some gates on them, and no classical bits yet.",
        "First, `measure_all()` adds a barrier.",
        "Then it adds a new 3-bit classical register called `meas`.",
        "Then it measures every qubit into its own bit of `meas`.",
        "That gives 3 classical bits, all in `meas`, which is why your Sampler counts are in `data.meas`.",
      ],
    },
  },
  {
    section: 3,
    q: "What does this print?",
    code: `qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()
print(qc.num_clbits)`,
    options: ["2", "0", "1", "4"],
    answer: 3,
    explain: "`QuantumCircuit(2, 2)` already has two classical bits in a register called `c`. `measure_all()` adds a new `meas` register by default, giving four in total. With SamplerV2 you'd find an all-zero `data.c` next to your real results in `data.meas`. Use `measure_all(add_bits=False)` or an explicit `measure([0, 1], [0, 1])` instead.",
    anim: {
      type: "registers",
      qubits: 2, cregs: [{ name: "c", size: 2 }], add: { name: "meas", size: 2 },
      notes: [
        "`QuantumCircuit(2, 2)` already has a 2-bit register called `c`.",
        "`measure_all()` adds its barrier...",
        "...and then a new register called `meas`. It doesn't reuse `c`.",
        "The measurements go into `meas`. Nothing is ever written to `c`.",
        "`num_clbits` is 4. The two bits in `c` stay 0 on every shot.",
      ],
    },
  },
  {
    section: 3,
    q: "What does this print?",
    code: `t = Parameter("t")
qc = QuantumCircuit(1)
qc.rx(t, 0)
bound = qc.assign_parameters({t: 0.3})
print(qc.num_parameters, bound.num_parameters)`,
    options: ["0 0", "1 1", "1 0", "0 1"],
    answer: 2,
    explain: "`assign_parameters` returns a new circuit by default (`inplace=False`), so the original stays a reusable template. Usually that's what you want. Often you don't need to bind values yourself at all, because the primitives take parameter values directly in the PUB.",
    anim: {
      type: "steps",
      items: [
        { t: "qc", s: "rx(t), 1 parameter" },
        { t: "assign_parameters({t: 0.3})", s: "works on a copy", mark: "pick" },
        { t: "bound", s: "rx(0.3), 0 parameters", mark: "ok" },
        { t: "qc", s: "still rx(t), 1 parameter", mark: "ok" },
      ],
      notes: [
        "Start with a template circuit.",
        "`assign_parameters` makes a copy by default (`inplace=False`).",
        "The copy gets the value filled in.",
        "The original stays as it was, ready for the next value. So the output is `1 0`.",
      ],
    },
  },
  {
    section: 3,
    q: "How many parameters does this circuit have?",
    code: `theta = ParameterVector("θ", 3)
qc = QuantumCircuit(2)
qc.ry(theta[0], 0)
qc.ry(theta[2], 1)
qc.rz(theta[0], 1)
print(qc.num_parameters)`,
    options: ["3", "1", "2", "4"],
    answer: 2,
    explain: "`num_parameters` counts the unique unbound parameters that appear in the circuit. θ[1] is never used, and θ[0] counts once even though it appears twice. When you pass values to a primitive, you supply exactly this many, in the order of `qc.parameters`.",
    anim: {
      type: "steps", layout: "list",
      title: "Counting the parameters one by one",
      items: [
        { t: "θ[0]", s: "used in ry on q0, so it counts", mark: "ok" },
        { t: "θ[1]", s: "never used, so it isn't part of the circuit", mark: "bad" },
        { t: "θ[2]", s: "used in ry on q1, so it counts", mark: "ok" },
        { t: "θ[0] again", s: "in rz on q1, but it's already counted", mark: "bad" },
        { t: "num_parameters = 2", mark: "pick" },
      ],
    },
  },
  {
    section: 3,
    q: "Where does the H gate end up?",
    code: `big = QuantumCircuit(3)
small = QuantumCircuit(2)
small.h(0)
small.cx(0, 1)
out = big.compose(small, qubits=[2, 0])`,
    options: ["Qubit 2", "Qubit 0", "Qubit 1", "Qubits 2 and 0"],
    answer: 0,
    explain: "The `qubits` list maps the small circuit's qubits, in order, onto the big one: small qubit 0 goes to big qubit 2, and small qubit 1 goes to big qubit 0. So H lands on qubit 2, and the CX becomes `cx(2, 0)`.",
    anim: {
      type: "map",
      title: "Reading qubits=[2, 0]",
      left: { title: "small", items: ["q0 (H, control)", "q1 (target)"] },
      right: { title: "big", items: ["q0", "q1", "q2"] },
      links: [{ from: 0, to: 2 }, { from: 1, to: 0 }],
      notes: [
        "Each position in `qubits=[2, 0]` says where one of the small circuit's qubits goes.",
        "Position 0 holds a 2, so small q0 goes to big q2. That's where H lands.",
        "Position 1 holds a 0, so small q1 goes to big q0. The CX becomes `cx(2, 0)`, and big q1 isn't touched.",
      ],
    },
  },
  {
    section: 3,
    q: "A teammate writes `qc.compose(oracle)` and then adds measurements, but the oracle isn't in the drawn circuit. Why?",
    options: [
      "`compose` only works with single gates, not circuits",
      "`compose` returns a new circuit. Either reassign (`qc = qc.compose(oracle)`) or pass `inplace=True`",
      "`compose` needs a barrier before it",
      "The oracle has to be transpiled first",
    ],
    answer: 1,
    explain: "Like `assign_parameters`, `compose` leaves the original alone unless you ask otherwise. It's an easy bug to miss because nothing raises an error. The oracle silently goes nowhere.",
    anim: {
      type: "steps",
      items: [
        { t: "qc", s: "no oracle" },
        { t: "qc.compose(oracle)", s: "builds a new circuit..." },
        { t: "new circuit", s: "...that nothing keeps", mark: "bad" },
        { t: "qc", s: "still no oracle", mark: "bad" },
        { t: "qc = qc.compose(oracle)", s: "or pass inplace=True", mark: "ok" },
      ],
    },
  },
  {
    section: 3,
    q: "What are `qc.depth()` and `qc.size()` here?",
    code: `qc = QuantumCircuit(3)
qc.h(0); qc.h(1); qc.h(2)
qc.cx(0, 1)
qc.cx(1, 2)`,
    options: ["depth 5, size 5", "depth 2, size 5", "depth 3, size 3", "depth 3, size 5"],
    answer: 3,
    explain: "The three H gates run in parallel, so they take one layer. `cx(0, 1)` is layer two. `cx(1, 2)` has to wait for qubit 1, so it's layer three. Size is simply the total number of operations, which is five.",
    anim: {
      type: "circuit", n: 3, view: [], byLayer: true, counts: true,
      title: "Layer by layer",
      gates: [["h", 0], ["h", 1], ["h", 2], ["cx", 0, 1], ["cx", 1, 2]],
      notes: [
        "Nothing has run yet: depth 0, size 0.",
        "Layer 1: the three H gates are on different qubits, so they run side by side. Depth 1, size 3.",
        "Layer 2: cx(0, 1) needs qubits 0 and 1, which are free now. Depth 2, size 4.",
        "Layer 3: cx(1, 2) has to wait until cx(0, 1) releases qubit 1. Depth 3, size 5.",
      ],
    },
  },
  {
    section: 3,
    q: "An older notebook uses `qc.x(1).c_if(cr, 1)` for a teleportation correction. What's the Qiskit 2.x way to write it?",
    code: `# the context-manager form
with qc.if_test((qc.clbits[0], 1)):
    qc.x(1)`,
    options: [
      "The `if_test` context manager shown above",
      "Keep `c_if`, since it still works",
      "`qc.x(1, condition=1)`",
      "`qc.conditional(XGate(), 1)`",
    ],
    answer: 0,
    explain: "`c_if` was removed in Qiskit 2.0. Classical control flow now uses context managers: `if_test`, `for_loop`, `while_loop` and `switch`. On IBM hardware these run as dynamic circuits, with mid-circuit measurement and feed-forward, which you need for teleportation and error-correction experiments.",
    anim: {
      type: "circuit", n: 2, clbits: 1, view: "amps",
      title: "One shot of a dynamic circuit (Replay for another)",
      gates: [["h", 0], ["measure", 0, 0], ["if", 0, 1, ["x", 1]]],
      notes: [
        "Start at '00'.",
        "H on qubit 0: '00' and '01' at 50% each.",
        "A mid-circuit measurement. This shot read c[0] = {c0}, and the state collapsed to match.",
        "`if_test` checks whether c[0] == 1. This time the X {ran}, so qubit 1 now matches qubit 0 either way. Press Replay to run another shot.",
      ],
    },
  },
  {
    section: 3,
    q: "You computed a value into an ancilla, used it, and now need the ancilla back in |0⟩ without disturbing the data qubits it is entangled with. What do you do?",
    options: [
      "`qc.reset(ancilla)`",
      "Append the inverse of the block that computed it: `qc.compose(compute.inverse(), inplace=True)`",
      "Add a barrier",
      "Measure the ancilla and ignore the result",
    ],
    answer: 1,
    explain: "`inverse()` reverses the gate order and takes the adjoint of each gate, so it undoes the computation coherently. Reset and measurement both collapse the ancilla, and because it's entangled with the data qubits they damage those too. That ruins the interference that algorithms like Grover rely on.",
    anim: {
      type: "circuit", n: 3, view: "amps",
      title: "Compute, use, uncompute",
      gates: [["h", 0], ["h", 1], ["ccx", 0, 1, 2], ["z", 2], ["ccx", 0, 1, 2]],
      notes: [
        "Qubits 0 and 1 hold the data, and qubit 2 is the ancilla. Everything starts at 0.",
        "H on qubit 0...",
        "...and H on qubit 1. There are four data states in superposition, and the ancilla (the leftmost bit) is still 0.",
        "Compute: CCX writes 'q0 AND q1' into the ancilla, so '011' becomes '111'.",
        "Use: Z on the ancilla flips the sign of '111', the one state where the AND was true.",
        "Uncompute: the same CCX again (it's its own inverse) clears the ancilla. It's back to 0 in every term, the superposition survives, and the minus sign stays on '011'. A reset or measurement would have collapsed all of that.",
      ],
    },
  },
  {
    section: 3,
    q: "How many parameters does `real_amplitudes(4, reps=2)` have?",
    code: `from qiskit.circuit.library import real_amplitudes
ansatz = real_amplitudes(4, reps=2)`,
    options: ["8", "16", "6", "12"],
    answer: 3,
    explain: "There is one layer of RY rotations per repetition plus a final layer, so the count is num_qubits × (reps + 1) = 4 × 3 = 12. Recent Qiskit 2.x releases favour the lowercase function forms such as `real_amplitudes` and `efficient_su2` over the older `RealAmplitudes` and `EfficientSU2` classes.",
    anim: {
      type: "circuit", n: 4, view: ["params"],
      title: "Building real_amplitudes(4, reps=2)",
      gates: [
        ["ry", 0, null, "θ0"], ["ry", 1, null, "θ1"], ["ry", 2, null, "θ2"], ["ry", 3, null, "θ3"],
        ["cx", 0, 1], ["cx", 1, 2], ["cx", 2, 3],
        ["ry", 0, null, "θ4"], ["ry", 1, null, "θ5"], ["ry", 2, null, "θ6"], ["ry", 3, null, "θ7"],
        ["cx", 0, 1], ["cx", 1, 2], ["cx", 2, 3],
        ["ry", 0, null, "θ8"], ["ry", 1, null, "θ9"], ["ry", 2, null, "θ10"], ["ry", 3, null, "θ11"],
      ],
      groups: [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9, 10], [11, 12, 13], [14, 15, 16, 17]],
      notes: [
        "Four qubits, two repetitions.",
        "The first RY layer: one parameter per qubit, 4 so far.",
        "The CX chain entangles the qubits and adds no parameters.",
        "RY layer for repetition 1: 8 so far.",
        "Another CX chain.",
        "The final RY layer: 12 parameters, which is 4 × (2 + 1).",
      ],
    },
  },
  {
    section: 3,
    q: "What does `count_ops()` return after this circuit is transpiled at optimization level 3?",
    code: `qc = QuantumCircuit(1)
qc.x(0)
qc.barrier()
qc.x(0)
isa = transpile(qc, basis_gates=["x", "rz", "sx"], optimization_level=3)`,
    options: ["{} (empty)", "{'x': 1}", "{'x': 2, 'barrier': 1}", "It raises an error"],
    answer: 2,
    explain: "Without the barrier, the two X gates cancel and the transpiler hands you an empty circuit. The barrier stops optimisation from crossing it, so both gates survive. That's handy in echo and benchmarking experiments, where you want those 'useless' gates kept on purpose.",
    anim: {
      type: "cancel",
      notes: [
        "The same two X gates, once without a barrier and once with one in between.",
        "The optimiser pushes them together. Without a barrier they meet. With one, they can't cross it.",
        "X·X = I, so the first pair cancels to `{}`. The second pair survives: `{'x': 2, 'barrier': 1}`.",
      ],
    },
  },

  // ---------------------------------------------------------------- Section 4
  {
    section: 4,
    q: "You send a circuit containing `h` and `ccx` straight to SamplerV2 on an IBM backend, and it is rejected because it contains instructions the target doesn't support. What's the fix?",
    code: `pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
isa_circuit = pm.run(qc)`,
    options: [
      "Increase the shot count",
      "Transpile to an ISA circuit first, as shown",
      "Remove all measurements",
      "Open a Session",
    ],
    answer: 1,
    explain: "IBM Runtime only accepts ISA circuits, meaning circuits that use the backend's native gates and respect its connectivity. It won't transpile for you. A preset pass manager is the usual way to produce one.",
    anim: {
      type: "steps",
      items: [
        { t: "qc", s: "h, ccx" },
        { t: "SamplerV2.run([qc])", s: "rejected: not ISA", mark: "bad" },
        { t: "pm.run(qc)", s: "preset pass manager", mark: "pick" },
        { t: "isa_circuit", s: "rz, sx, x, cz on real qubits" },
        { t: "SamplerV2.run([isa_circuit])", s: "accepted", mark: "ok" },
      ],
      notes: [
        "Your circuit, written with convenient high-level gates.",
        "Runtime won't translate it for you, so it rejects the job.",
        "The pass manager rewrites it for this particular device...",
        "...using only native gates on qubits that are actually connected.",
        "Now the job goes through.",
      ],
    },
  },
  {
    section: 4,
    q: "You call `transpile(qc, backend=backend)` without setting `optimization_level`. Which level does Qiskit 2.x use?",
    options: ["0", "1", "2", "3"],
    answer: 2,
    explain: "The default moved from 1 to 2 back in Qiskit 1.3, and `generate_preset_pass_manager` also defaults to 2. Level 3 searches harder and takes longer to compile, which is often worth it for deep circuits that will run many times.",
    anim: {
      type: "steps", layout: "tuple",
      items: [
        { k: "level 0", t: "no optimisation", s: "just make it run" },
        { k: "level 1", t: "light", s: "the default until Qiskit 1.3" },
        { k: "level 2", t: "default now", s: "a good balance", mark: "pick" },
        { k: "level 3", t: "heaviest", s: "slower to compile" },
      ],
    },
  },
  {
    section: 4,
    q: "You're running VQE: hundreds of short Estimator calls, each depending on the result of the last. Which execution mode fits best?",
    options: ["Session", "Batch", "Job mode, one job at a time", "Local simulator only"],
    answer: 0,
    explain: "A session keeps the QPU available to you between iterations, so you don't rejoin the queue for every optimiser step. Sessions aren't available on the free Open plan, so if that's your plan you'll be using job or batch mode.",
    anim: {
      type: "timeline", total: 17,
      title: "Five VQE steps, two ways",
      legend: { mine: "your VQE step", other: "other users' jobs" },
      lanes: [
        { name: "Job mode", blocks: [
          { s: 0, l: 1, k: "mine" }, { s: 1, l: 3, k: "other" }, { s: 4, l: 1, k: "mine" }, { s: 5, l: 3, k: "other" },
          { s: 8, l: 1, k: "mine" }, { s: 9, l: 3, k: "other" }, { s: 12, l: 1, k: "mine" }, { s: 13, l: 3, k: "other" },
          { s: 16, l: 1, k: "mine" },
        ] },
        { name: "Session", blocks: [
          { s: 0, l: 1, k: "mine" }, { s: 1.5, l: 1, k: "mine" }, { s: 3, l: 1, k: "mine" }, { s: 4.5, l: 1, k: "mine" }, { s: 6, l: 1, k: "mine" },
        ] },
      ],
      notes: [
        "The same five optimiser steps, run two different ways.",
        "In job mode, every step goes back to the end of the queue.",
        "Other users' jobs fill the gaps while your optimiser waits.",
        "In a session, the device waits for your optimiser between steps.",
        "The session finished long ago, and job mode is still going.",
        "With hundreds of iterations, that difference adds up to hours.",
      ],
    },
  },
  {
    section: 4,
    q: "You need to run 300 independent characterisation circuits, and none depends on another's result. Which mode makes the most sense?",
    options: ["Session", "A loop that submits one job per circuit", "Local simulator", "Batch"],
    answer: 3,
    explain: "Batch is meant for independent jobs. The scheduler can overlap their classical pre- and post-processing, and you don't hold the device idle between them as you would in a session.",
    anim: {
      type: "timeline", total: 16,
      title: "300 circuits, shown as 8",
      legend: { mine: "your job running", wait: "waiting in the queue" },
      lanes: [
        { name: "One job each", blocks: [
          { s: 0, l: 1, k: "wait" }, { s: 1, l: 1, k: "mine" }, { s: 2, l: 1, k: "wait" }, { s: 3, l: 1, k: "mine" },
          { s: 4, l: 1, k: "wait" }, { s: 5, l: 1, k: "mine" }, { s: 6, l: 1, k: "wait" }, { s: 7, l: 1, k: "mine" },
          { s: 8, l: 1, k: "wait" }, { s: 9, l: 1, k: "mine" }, { s: 10, l: 1, k: "wait" }, { s: 11, l: 1, k: "mine" },
          { s: 12, l: 1, k: "wait" }, { s: 13, l: 1, k: "mine" }, { s: 14, l: 1, k: "wait" }, { s: 15, l: 1, k: "mine" },
        ] },
        { name: "Batch", blocks: [
          { s: 0, l: 1, k: "wait" }, { s: 1, l: 0.9, k: "mine" }, { s: 2, l: 0.9, k: "mine" }, { s: 3, l: 0.9, k: "mine" },
          { s: 4, l: 0.9, k: "mine" }, { s: 5, l: 0.9, k: "mine" }, { s: 6, l: 0.9, k: "mine" }, { s: 7, l: 0.9, k: "mine" }, { s: 8, l: 0.9, k: "mine" },
        ] },
      ],
      notes: [
        "The circuits are independent, so the order doesn't matter.",
        "Submitted one at a time, each job waits in the queue separately.",
        "As a batch they're scheduled together, and their classical prep overlaps.",
        "Unlike a session, nothing waits on a previous result, so there's no reserved idle time.",
        "The batch is done in about half the time.",
      ],
    },
  },
  {
    section: 4,
    q: "You want to dry-run your whole pipeline with realistic device noise, without spending any QPU time. What works?",
    code: `from qiskit_ibm_runtime import SamplerV2
from qiskit_ibm_runtime.fake_provider import FakeSherbrooke`,
    options: [
      "`SamplerV2(mode=FakeSherbrooke())`",
      "`QiskitRuntimeService(channel='fake')`",
      "`execute(qc, 'fake')`",
      "It isn't possible without real hardware",
    ],
    answer: 0,
    explain: "If you pass a fake backend as the `mode`, the primitives run in local testing mode on Aer, using a noise model taken from a snapshot of that device. You need `qiskit-aer` installed. The snapshot is old, so don't expect the numbers to match today's device.",
    anim: {
      type: "steps",
      items: [
        { t: "SamplerV2(mode=FakeSherbrooke())" },
        { t: "Aer simulator", s: "running on your machine" },
        { t: "+ noise model", s: "from a calibration snapshot" },
        { t: "noisy counts", s: "and zero QPU time used", mark: "ok" },
      ],
    },
  },
  {
    section: 4,
    q: "Which call picks the real device with the shortest queue?",
    options: [
      "`service.backends()[0]`",
      "`service.fastest()`",
      "`service.least_busy(operational=True, simulator=False)`",
      "`AerSimulator()`",
    ],
    answer: 2,
    explain: "`least_busy` sorts by pending jobs. The shortest queue isn't always the best choice, though. A device with better error rates on the qubits you need can be worth the wait.",
    anim: {
      type: "bars",
      title: "Pending jobs per device",
      series: [{ name: "pending jobs", data: { "device A": 412, "device B": 38, "device C": 156, "device D": 97 } }],
      highlight: ["device B"],
      notes: [
        "Four real devices you have access to.",
        "`least_busy()` looks at how many jobs are waiting on each one...",
        "...and returns the one with the shortest queue. Check its error rates before you commit to it.",
      ],
    },
  },
  {
    section: 4,
    q: "An old tutorial runs circuits with `execute(qc, backend)`. What's the Qiskit 2.x approach?",
    options: [
      "`execute` still works",
      "Transpile to ISA, then call `SamplerV2(mode=backend).run([isa])` or the Estimator equivalent",
      "`qc.run(backend)`",
      "`backend.execute(qc)`",
    ],
    answer: 1,
    explain: "`execute` was removed in Qiskit 1.0, and the V1 `Sampler` and `Estimator` reference classes were removed in 2.0. For exact local results, use `StatevectorSampler` and `StatevectorEstimator`. For hardware, use the Runtime V2 primitives.",
    anim: {
      type: "steps",
      items: [
        { t: "execute(qc, backend)", s: "removed in 1.0", mark: "bad" },
        { t: "Sampler() (V1)", s: "removed in 2.0", mark: "bad" },
        { t: "transpile to ISA", mark: "pick" },
        { t: "SamplerV2(mode=backend).run([isa])", mark: "ok" },
      ],
    },
  },
  {
    section: 4,
    q: "Your circuit has 3 qubits. After `pm.run(qc)` for a 127-qubit device, `isa.num_qubits` prints 127. What happened?",
    options: [
      "The circuit was widened to the full device. Your 3 virtual qubits are mapped onto 3 physical ones, and the rest sit idle",
      "The transpiler hit an error",
      "You'll be billed 127× the shots",
      "The circuit was copied 42 times",
    ],
    answer: 0,
    explain: "ISA circuits are defined on the device's physical qubits. Which physical qubits you got is stored in `isa.layout`. This matters as soon as you use the Estimator, because your observables have to be widened the same way.",
    anim: {
      type: "map",
      left: { title: "your circuit", items: ["q0", "q1", "q2"] },
      right: { title: "ISA circuit (40 of 127 qubits shown)", cols: 10, count: 40 },
      links: [{ from: 0, to: 14 }, { from: 1, to: 15 }, { from: 2, to: 25 }],
      notes: [
        "Your circuit has three virtual qubits. The ISA circuit is written over the whole device.",
        "q0 → physical 14",
        "q1 → physical 15",
        "q2 → physical 25. All the other physical qubits are still part of the ISA circuit, they just have no gates on them. That's why `num_qubits` says 127.",
      ],
    },
  },
  {
    section: 4,
    q: "An H gate is transpiled for a backend whose basis is `{rz, sx, x, cz}`. What comes out?",
    options: ["`h`, unchanged", "`x` followed by `z`", "A `cz`", "`rz`, `sx`, `rz`"],
    answer: 3,
    explain: "H = RZ(π/2) · SX · RZ(π/2), up to a global phase. On IBM hardware RZ is a virtual frame change and costs essentially nothing, so the real cost of a single-qubit gate is roughly its number of SX and X pulses.",
    anim: {
      type: "circuit", n: 1, view: "bloch",
      title: "H rebuilt from native gates",
      gates: [["rz", 0, PI / 2, "π/2"], ["sx", 0], ["rz", 0, PI / 2, "π/2"]],
      notes: [
        "Start at |0⟩. H would take this to |+⟩, on the X axis.",
        "RZ(π/2) turns the arrow about the axis it already points along, so nothing visible happens. On IBM hardware an RZ costs nothing anyway.",
        "SX is a quarter turn about X, which takes the arrow to −Y. This is the only physical pulse in the sequence.",
        "Another RZ(π/2), a quarter turn about Z, brings it to +X, which is |+⟩. That's exactly where H would have put it.",
      ],
    },
  },

  // ---------------------------------------------------------------- Section 5
  {
    section: 5,
    q: "You built your circuit with `measure_all()` and ran it with `sampler.run([qc])`. How do you get the counts?",
    options: [
      "`result.get_counts()`",
      "`result[0].data.meas.get_counts()`",
      "`result[0].quasi_dists`",
      "`result.data['counts']`",
    ],
    answer: 1,
    explain: "With V2 primitives you go step by step: the `PrimitiveResult`, then `[0]` for the first PUB, then `.data`, then the classical register name, which gives you a `BitArray`. `quasi_dists` belonged to the old V1 Sampler.",
    anim: {
      type: "steps",
      title: "Drilling into a V2 result",
      items: [
        { t: "result", s: "PrimitiveResult" },
        { t: "[0]", s: "the first PUB" },
        { t: ".data", s: "DataBin" },
        { t: ".meas", s: "BitArray, named after the register" },
        { t: ".get_counts()", s: "{'00': 517, '11': 507}", mark: "ok" },
      ],
    },
  },
  {
    section: 5,
    q: "Your circuit was built as `QuantumCircuit(2, 2)` and measured with `qc.measure([0, 1], [0, 1])`. Calling `result[0].data.meas` raises `AttributeError`. Why?",
    options: [
      "The Sampler drops explicit measurements",
      "You need `measure_all()` for the Sampler to work",
      "The register is called `c`, so use `result[0].data.c`",
      "The shot count was too low",
    ],
    answer: 2,
    explain: "When you create a circuit as `QuantumCircuit(n, m)`, the classical register is named `c`. If you're not sure, `list(result[0].data.keys())` tells you exactly which registers came back.",
    anim: {
      type: "steps",
      items: [
        { t: "result[0].data" },
        { t: ".meas", s: "AttributeError", mark: "bad" },
        { t: "list(data.keys())", s: "['c']", mark: "pick" },
        { t: ".c.get_counts()", mark: "ok" },
      ],
      notes: [
        "You're at the DataBin.",
        "`meas` only exists if `measure_all()` created it.",
        "Asking the DataBin which registers it holds settles it.",
        "Use the register that's actually there.",
      ],
    },
  },
  {
    section: 5,
    q: "Which call runs this circuit for exactly 500 shots?",
    options: [
      "`sampler.run([(qc, None, 500)])`",
      "`sampler.run([qc, 500])`",
      "`sampler.run(qc, 500)`",
      "`sampler.run([(500, qc)])`",
    ],
    answer: 0,
    explain: "A Sampler PUB is `(circuit, parameter_values, shots)`. You can also write `sampler.run([qc], shots=500)`, which applies to every PUB that doesn't set its own. A per-PUB value wins. `[qc, 500]` would make 500 a second PUB, which fails.",
    anim: {
      type: "steps", layout: "tuple",
      title: "Filling in a Sampler PUB",
      items: [
        { k: "circuit", t: "qc" },
        { k: "parameter_values", t: "None", s: "no parameters" },
        { k: "shots", t: "500", mark: "pick" },
      ],
      notes: [
        "A Sampler PUB has three slots, always in this order.",
        "This circuit has no parameters, so the second slot is None.",
        "Shots go in the third slot: `sampler.run([(qc, None, 500)])`.",
      ],
    },
  },
  {
    section: 5,
    q: "You run `StatevectorSampler().run([qc])` without setting shots. How many shots do you get?",
    options: ["1000", "1024", "4096", "None. It returns exact probabilities"],
    answer: 1,
    explain: "`default_shots` is 1024. Even though it's built on an exact statevector, it still samples, so the counts wobble from run to run. Pass `seed=` if you need reproducible numbers in a test, or use `Statevector.probabilities_dict()` for the exact values.",
    anim: {
      type: "bars",
      title: "A Bell circuit, sampled live (Replay for a different run)",
      sample: { probs: { "00": 0.5, "01": 0, "10": 0, "11": 0.5 }, shots: 1024, batches: 8 },
      noteMid: "{shots} shots so far. Each one is a single random outcome.",
      notes: [
        "No shots yet. With no `shots=` argument, StatevectorSampler takes 1024.",
        "All 1024 shots are in. It's close to 50/50 but not exact, because it really is sampling. Replay and the numbers change.",
      ],
    },
  },
  {
    section: 5,
    q: "You're sweeping a rotation angle for a Rabi-style calibration. The circuit has one parameter and you pass a values array of shape (20, 1) in a single PUB. What is `result[0].data.meas.shape`?",
    options: ["(20, 1)", "(1,)", "(20,)", "(1024, 20)"],
    answer: 2,
    explain: "The last axis of the parameter array holds the circuit's parameters, which is one here. Whatever is left, (20,), is the shape of the PUB, so you get one `BitArray` slice per angle. `get_counts(loc=7)` gives the counts for the eighth angle. That's one PUB instead of twenty separate jobs.",
    anim: {
      type: "shape",
      inputs: [{ label: "parameter values", rows: 1, cols: 20, caption: "(20, 1): 20 angles × 1 parameter" }],
      output: { label: "data.meas", rows: 1, cols: 20, caption: "(20,): one BitArray per angle" },
      notes: [
        "20 angles, each a little list holding the circuit's one parameter.",
        "The last axis is used up by that parameter...",
        "...and what's left, (20,), is the shape of the result: one BitArray per angle. `get_counts(loc=7)` is the eighth.",
      ],
    },
  },
  {
    section: 5,
    q: "Which of these lines is not a valid option on Qiskit Runtime's `SamplerV2`?",
    options: [
      "`sampler.options.default_shots = 4000`",
      "`sampler.options.dynamical_decoupling.enable = True`",
      "`sampler.options.twirling.enable_gates = True`",
      "`sampler.options.resilience_level = 1`",
    ],
    answer: 3,
    explain: "`resilience_level` is an Estimator option. The Sampler supports error suppression such as dynamical decoupling and Pauli twirling, but not the readout mitigation and ZNE levels you get with the Estimator.",
    anim: {
      type: "steps", layout: "list",
      title: "SamplerV2 options",
      items: [
        { t: "default_shots", s: "how many shots to take", mark: "ok" },
        { t: "dynamical_decoupling", s: "pulse sequences that protect idle qubits", mark: "ok" },
        { t: "twirling", s: "turns coherent errors into random noise", mark: "ok" },
        { t: "resilience_level", s: "Estimator only", mark: "bad" },
      ],
    },
  },
  {
    section: 5,
    q: "Your circuit measures into two registers, `alice` and `bob`, and you want one combined bitstring per shot. Which call gives you that?",
    options: [
      "`result[0].join_data().get_counts()`",
      "`result[0].data.alice + result[0].data.bob`",
      "`result.get_counts(all=True)`",
      "You can't do this with V2 results",
    ],
    answer: 0,
    explain: "`join_data()` concatenates the registers into a single `BitArray`. The register added later sits on the left, the same little-endian convention as qubits. With `alice = 0` and `bob = 1`, you get `'10'`.",
    anim: {
      type: "order",
      text: "10",
      title: "How join_data() orders the registers",
      targets: ["alice[0]", "bob[0]"],
      segments: [{ from: 0, to: 0, label: "bob" }, { from: 1, to: 1, label: "alice" }],
      notes: [
        "`join_data()` merges both registers into one bitstring.",
        "The rightmost bit comes from `alice`, the register added first. She measured 0.",
        "`bob` was added second, so his bit goes on the left: 1. Combined, that's '10'.",
      ],
    },
  },

  // ---------------------------------------------------------------- Section 6
  {
    section: 6,
    q: "What is the layout of an Estimator PUB?",
    options: [
      "`(circuit, observables, parameter_values, precision)`",
      "`(observables, circuit)`",
      "`(circuit, shots, observables)`",
      "`(circuit, parameter_values, shots)`",
    ],
    answer: 0,
    explain: "Only the circuit and the observables are required. `(circuit, parameter_values, shots)` is a Sampler PUB, which is an easy one to mix up. Results come back as `result[0].data.evs` for the values and `result[0].data.stds` for their standard errors.",
    anim: {
      type: "steps", layout: "tuple",
      title: "Filling in an Estimator PUB",
      items: [
        { k: "circuit", t: "isa" },
        { k: "observables", t: "SparsePauliOp('ZZ')" },
        { k: "parameter_values", t: "[0.1, 0.4]", s: "optional" },
        { k: "precision", t: "0.01", s: "optional" },
      ],
      notes: [
        "The circuit always goes first.",
        "Observables come second. This is the difference from a Sampler PUB, where the second slot is parameter values.",
        "Next come the parameter values, if your circuit has any.",
        "Last is the target precision, if you want something other than the default.",
      ],
    },
  },
  {
    section: 6,
    q: "You transpile a 2-qubit ansatz for a 127-qubit backend, then run `estimator.run([(isa, SparsePauliOp('ZZ'))])`. It fails because the observable doesn't match the circuit. What's the right fix?",
    options: [
      "Pad it with identities: `SparsePauliOp('I' * 125 + 'ZZ')`",
      "`observable.apply_layout(isa.layout)`",
      "Transpile the observable with the pass manager",
      "Set `resilience_level = 0`",
    ],
    answer: 1,
    explain: "Padding with identities makes the sizes match, but it puts ZZ on physical qubits 0 and 1, and the router may well have placed your qubits somewhere else. `apply_layout` handles both the widening and the permutation.",
    anim: {
      type: "map",
      title: "Padding vs apply_layout",
      left: { title: "observable ZZ", items: ["Z on q0", "Z on q1"] },
      right: { title: "physical qubits", cols: 8, count: 24 },
      links: [{ from: 0, to: 0, bad: true }, { from: 1, to: 1, bad: true }, { from: 0, to: 13 }, { from: 1, to: 14 }],
      notes: [
        "Your ZZ observable acts on virtual qubits 0 and 1.",
        "Padding with identities puts the first Z on physical qubit 0...",
        "...and the second on physical qubit 1. But your circuit doesn't live there.",
        "`apply_layout` follows the layout instead. q0 actually ended up on physical 13...",
        "...and q1 on physical 14. Now the observable measures the qubits that actually hold your state.",
      ],
    },
  },
  {
    section: 6,
    q: "For the Bell state (|00⟩ + |11⟩)/√2, what are the ideal expectation values of ZZ, XX and ZI?",
    code: `bell = QuantumCircuit(2)
bell.h(0)
bell.cx(0, 1)
estimator.run([(bell, ["ZZ", "XX", "ZI"])])`,
    options: ["[1, 0, 0]", "[0.5, 0.5, 0]", "[1, −1, 0]", "[1, 1, 0]"],
    answer: 3,
    explain: "The two qubits are perfectly correlated in both the Z and X bases, but each qubit on its own is completely random. Measuring ZZ and XX together is a cheap way to check entanglement on real hardware: if both come back close to 1, your Bell pair is in good shape.",
    anim: {
      type: "circuit", n: 2, view: "expect",
      title: "Expectation values as the Bell state forms",
      observables: ["ZZ", "XX", "ZI"],
      gates: [["h", 0], ["cx", 0, 1]],
      notes: [
        "At |00⟩, ZZ = 1 and ZI = 1, but XX = 0.",
        "After H on qubit 0, ZZ and XX are both 0. ZI (Z on qubit 1) is still 1, because qubit 1 hasn't been touched.",
        "After CX you have the Bell state: ZZ = 1 and XX = 1, perfectly correlated in both bases, while ZI drops to 0 because each qubit on its own is now random.",
      ],
    },
  },
  {
    section: 6,
    q: "Observables are passed as an array of shape (3, 1) and parameter values as shape (20, 1) for a one-parameter circuit. What shape is `result[0].data.evs`?",
    code: `estimator.run([(qc, [["ZZ"], ["XX"], ["ZI"]], values)])  # values.shape == (20, 1)`,
    options: ["(20,)", "(3,)", "(3, 20)", "(60, 1)"],
    answer: 2,
    explain: "The parameter array has a broadcast shape of (20,), and NumPy broadcasting of (3, 1) with (20,) gives (3, 20). So you get every observable at every angle, 60 numbers from one PUB.",
    anim: {
      type: "shape",
      title: "Broadcasting observables against parameters",
      inputs: [
        { label: "observables", rows: 3, cols: 1, caption: "(3, 1)" },
        { label: "parameter sets", rows: 1, cols: 20, caption: "(20,)" },
      ],
      output: { label: "evs", rows: 3, cols: 20, caption: "(3, 20)" },
      notes: [
        "Three observables stacked as a column, and twenty angles laid out as a row.",
        "NumPy broadcasting stretches each one along the other's axis...",
        "...giving every observable at every angle: 60 expectation values from a single PUB.",
      ],
    },
  },
  {
    section: 6,
    q: "What does `resilience_level = 1`, the Runtime Estimator default, apply?",
    options: [
      "No mitigation at all",
      "Readout error mitigation (TREX)",
      "Zero-noise extrapolation",
      "Full probabilistic error cancellation",
    ],
    answer: 1,
    explain: "Level 0 applies nothing. Level 1 adds TREX for readout errors. Level 2 adds zero-noise extrapolation and gate twirling on top. Each step up costs more runtime and usually increases the variance, so only go higher when the bias is actually hurting you.",
    anim: {
      type: "steps", layout: "list",
      title: "Each level adds to the one before",
      items: [
        { t: "level 0", s: "no mitigation" },
        { t: "level 1 (default)", s: "+ TREX readout-error mitigation", mark: "pick" },
        { t: "level 2", s: "+ zero-noise extrapolation and gate twirling" },
      ],
    },
  },
  {
    section: 6,
    q: "You're computing the energy of a small transverse-field Ising model on the state |00⟩. What does the Estimator return?",
    code: `H = SparsePauliOp.from_list([("ZZ", 0.5), ("IX", 0.5)])
estimator.run([(QuantumCircuit(2), H)])`,
    options: ["0.5", "1.0", "0", "−0.5"],
    answer: 0,
    explain: "Expectation values are linear, so the energy is 0.5·⟨ZZ⟩ + 0.5·⟨IX⟩ = 0.5·1 + 0.5·0. Remember that `IX` puts the X on qubit 0. This number is exactly what a VQE loop tries to minimise.",
    anim: {
      type: "steps", layout: "tuple",
      title: "Adding up the Hamiltonian term by term",
      items: [
        { k: "term 1", t: "0.5 × ⟨ZZ⟩", s: "= 0.5 × 1" },
        { k: "term 2", t: "0.5 × ⟨IX⟩", s: "= 0.5 × 0" },
        { k: "energy", t: "0.5", mark: "ok" },
      ],
      notes: [
        "|00⟩ is a +1 eigenstate of ZZ, so the first term is 0.5 × 1.",
        "X on qubit 0 of |0⟩ averages to 0, so the second term contributes nothing.",
        "The weighted terms add up to 0.5. In VQE, the optimiser keeps changing the circuit to push this number down.",
      ],
    },
  },
  {
    section: 6,
    q: "Your Estimator result has a standard error of about 0.02. Roughly how many more shots do you need to bring it down to 0.01?",
    options: ["2×", "10×", "100×", "4×"],
    answer: 3,
    explain: "Shot noise falls as 1/√N, so halving the error takes four times the shots. On hardware, mitigation adds its own sampling overhead on top of that, so budget accordingly.",
    anim: {
      type: "curve",
      c: 0.02 * Math.sqrt(1000), xmin: 250, xmax: 5000,
      ymax: 0.042, xticks: [1000, 2000, 3000, 4000, 5000], yticks: [0.01, 0.02, 0.03, 0.04],
      points: [1000, 2000, 4000],
      notes: [
        "1,000 shots give a standard error of 0.02.",
        "Doubling to 2,000 shots only gets you to about 0.014.",
        "Quadrupling to 4,000 shots gets you to 0.01. Error falls as 1/√N, so halving it costs four times the shots.",
      ],
    },
  },

  // ---------------------------------------------------------------- Section 7
  {
    section: 7,
    q: "You submitted a hardware job yesterday and closed your notebook. You saved the job ID. How do you get the results now?",
    options: [
      "Re-run the circuit",
      "`job.restore()`",
      "`service.job('<job_id>').result()`",
      "`QiskitRuntimeService.load('<job_id>')`",
    ],
    answer: 2,
    explain: "This is why you should always print or log `job.job_id()` when you submit. IBM keeps results for a while, but without the ID you'll be digging through the dashboard to find them.",
    anim: {
      type: "steps",
      items: [
        { t: "sampler.run(...)", s: "Monday" },
        { t: "job.job_id()", s: "write it down!", mark: "pick" },
        { t: "notebook closed", s: "the job object is gone" },
        { t: "service.job(id).result()", s: "Tuesday", mark: "ok" },
      ],
    },
  },
  {
    section: 7,
    q: "`job.status()` returns `'QUEUED'`. What does that mean?",
    options: [
      "The job failed",
      "It's waiting for its turn on the device and nothing has run yet",
      "It's running right now",
      "It finished, but the results expired",
    ],
    answer: 1,
    explain: "After QUEUED you'll typically see RUNNING and then DONE, or ERROR or CANCELLED if something went wrong. `job.result()` blocks until the job finishes, so you don't need a polling loop if you're happy to wait.",
    anim: {
      type: "steps",
      title: "A job's life",
      items: [
        { t: "INITIALIZING", s: "being validated" },
        { t: "QUEUED", s: "you are here: waiting your turn", mark: "pick" },
        { t: "RUNNING", s: "on the QPU" },
        { t: "DONE", s: "results ready", mark: "ok" },
      ],
    },
  },
  {
    section: 7,
    q: "A Bell circuit on hardware returns these counts. What fraction of shots landed on the outcomes you'd expect?",
    code: `{'00': 480, '11': 470, '01': 28, '10': 46}`,
    options: ["≈ 0.928", "0.950", "≈ 0.072", "≈ 0.469"],
    answer: 0,
    explain: "The total is 1024 shots, not 1000, so it's (480 + 470) / 1024 ≈ 0.928. 0.950 is what you get if you assume 1000 shots. Keep in mind that this is only a Z-basis check. A mixed state of 00 and 11 would score just as well, so to confirm real entanglement you also need the XX correlation.",
    anim: {
      type: "bars",
      series: [{ name: "counts", data: { "00": 480, "01": 28, "10": 46, "11": 470 } }],
      highlight: ["00", "11"],
      notes: [
        "A noisy Bell circuit. First check the total: 480 + 28 + 46 + 470 = 1024, not 1000.",
        "One bar per bitstring.",
        "00 + 11 = 950 out of 1024, which is about 0.928. The other 74 shots are noise.",
      ],
    },
  },
  {
    section: 7,
    q: "Your report needs error bars on each Estimator expectation value. Where do they come from?",
    options: [
      "`result[0].metadata['shots']`",
      "`job.status()`",
      "`result[0].data.evs ** 2`",
      "`result[0].data.stds`",
    ],
    answer: 3,
    explain: "`stds` has the same shape as `evs` and gives the standard error of each value. If you report an expectation value without one, a reviewer will rightly ask for it.",
    anim: {
      type: "bars", format: "fixed2",
      title: "evs with stds drawn as error bars",
      series: [{ name: "evs", data: { ZZ: 0.91, XX: 0.87, ZI: 0.03 } }],
      err: { ZZ: 0.03, XX: 0.05, ZI: 0.04 },
      notes: [
        "Three observables from a Bell-state experiment.",
        "The bars are `data.evs`, and the whiskers are `data.stds`, which has the same shape and gives one error per value.",
      ],
    },
  },
  {
    section: 7,
    q: "You want to check whether readout errors drift during a long run, so you need every shot's outcome in order, not totals. Which `BitArray` method gives you that?",
    options: ["`get_counts()`", "`get_bitstrings()`", "`get_int_counts()`", "`num_shots`"],
    answer: 1,
    explain: "Counts add everything up and throw away the order. `get_bitstrings()` returns one string per shot, so you can slice it into windows and compare them.",
    anim: {
      type: "stream", chunk: 8, good: ["00", "11"],
      title: "get_bitstrings() keeps the order, get_counts() doesn't",
      shots: [
        "00", "11", "11", "00", "00", "11", "00", "11",
        "11", "00", "01", "11", "00", "11", "00", "11",
        "10", "11", "00", "01", "11", "10", "00", "01",
      ],
      notes: [
        "`get_bitstrings()` hands you one string per shot, in the order they were taken.",
        "The first eight shots are all clean.",
        "In the middle, the first error shows up.",
        "Near the end, errors (in red) come more often. That's drift.",
        "`get_counts()` adds everything up. The totals are the same, but you can no longer tell when the errors happened.",
      ],
    },
  },
  {
    section: 7,
    q: "What counts does this produce?",
    code: `qc = QuantumCircuit(3)
qc.x(0)
qc.measure_all()
StatevectorSampler().run([qc]).result()[0].data.meas.get_counts()`,
    options: ["{'100': 1024}", "{'010': 1024}", "{'001': 1024}", "{'1': 1024}"],
    answer: 2,
    explain: "Qubit 0 is the rightmost character in the bitstring. If you post-process counts by indexing into the string, remember that `bitstring[-1]` is qubit 0, not `bitstring[0]`.",
    anim: {
      type: "order",
      text: "001",
      highlight: [0],
      notes: [
        "Every shot gives the same key, '001'. Which character is which qubit?",
        "The rightmost character is qubit 0, the one that got the X. It reads 1.",
        "Qubit 1 reads 0.",
        "The leftmost character is qubit 2, which reads 0. So in Python, `bitstring[-1]` is qubit 0.",
      ],
    },
  },

  // ---------------------------------------------------------------- Section 8
  {
    section: 8,
    q: "You need to hand a circuit with an `if_test` block to a partner team as plain text. Which export works?",
    options: ["`qasm3.dumps(qc)`", "`qasm2.dumps(qc)`", "`qc.draw('text')`", "`str(qc)`"],
    answer: 0,
    explain: "OpenQASM 2 only has the old register-equality `if`, so `qasm2.dumps` raises `QASM2ExportError` on this circuit. OpenQASM 3 handles it fine, and the output contains `if (c[0]) { x q[1]; }`.",
    anim: {
      type: "steps", layout: "list",
      items: [
        { t: "a circuit with if_test", s: "a measurement feeds a later gate" },
        { t: "qasm2.dumps(qc)", s: "QASM2ExportError: only register-equality conditions", mark: "bad" },
        { t: "qasm3.dumps(qc)", s: "if (c[0]) { x q[1]; }", mark: "ok" },
      ],
    },
  },
  {
    section: 8,
    q: "`qiskit.qasm3.loads(program)` raises `MissingOptionalLibraryError`. What's going on?",
    options: [
      "Qiskit can't import OpenQASM 3 at all",
      "You have to use `QuantumCircuit.from_qasm_str` instead",
      "The file must end in `.qasm`",
      "Importing needs the optional `qiskit-qasm3-import` package",
    ],
    answer: 3,
    explain: "Exporting to OpenQASM 3 is built in, but importing it needs `pip install qiskit-qasm3-import`. `QuantumCircuit.from_qasm_str` only reads OpenQASM 2, so it won't help with a 3.0 program.",
    anim: {
      type: "steps", layout: "list",
      items: [
        { t: "qasm3.dumps(qc)", s: "export is built in", mark: "ok" },
        { t: "qasm3.loads(text)", s: "MissingOptionalLibraryError", mark: "bad" },
        { t: "pip install qiskit-qasm3-import", mark: "pick" },
        { t: "qasm3.loads(text)", s: "works", mark: "ok" },
      ],
    },
  },
  {
    section: 8,
    q: "After you import this program into Qiskit, what does `input float theta;` become?",
    code: `OPENQASM 3.0;
include "stdgates.inc";
input float theta;
qubit[1] q;
bit[1] c;
rx(theta) q[0];
c[0] = measure q[0];`,
    options: [
      "A constant fixed at 0.0",
      "A `Parameter` named `theta` that you bind later, for example in the PUB",
      "A classical register",
      "A syntax error, because OpenQASM 3 has no inputs",
    ],
    answer: 1,
    explain: "`input` declarations are how OpenQASM 3 expresses values supplied at runtime, and they come into Qiskit as ordinary circuit parameters. That means a parameterised circuit can make the round trip through QASM without losing its parameters.",
    anim: {
      type: "steps",
      items: [
        { t: "input float theta;", s: "in the QASM text" },
        { t: "qasm3.loads(...)" },
        { t: "Parameter('theta')", s: "qc.parameters", mark: "pick" },
        { t: "sampler.run([(qc, [0.5])])", s: "bound at run time", mark: "ok" },
      ],
    },
  },
];
