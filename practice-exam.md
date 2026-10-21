# Qiskit v2.x Developer Associate: 60-Question Practice Exam

Original practice questions written against the published topic outline for IBM exam C1000-179. They are not real exam items. Every code snippet was run on Qiskit 2.5.

Each question is followed straight away by its answer, the reason it's right, and a step-by-step walkthrough. If you want to test yourself first, use the timed exam in `web/` instead: it hides the answers until you submit.

> This file is generated from `web/questions.js`. Edit that file, then run `node scripts/build-markdown.js`.


## Section 1: Perform quantum operations

### 1. You're writing the observable for a three-qubit sensor experiment and type `Pauli('XYZ')`. Which qubit does the X act on?

- **A.** Qubit 0
- **B.** Qubit 1
- **C.** Qubit 2
- **D.** All three qubits, one after another

**Answer: C.** Qubit 2

**Why:** Qiskit labels are little-endian, so you read them right to left: Z is on qubit 0, Y on qubit 1 and X on qubit 2. You can check it yourself, since `Pauli('XYZ')[0]` returns `Pauli('Z')`. Textbooks usually write qubit 0 first, so this catches a lot of people.

**Step by step:**

1. The label is a string, but its characters don't map to qubits left to right.
2. The last character, Z, belongs to qubit 0.
3. The middle character, Y, belongs to qubit 1.
4. The first character, X, belongs to qubit 2. The arrows cross because the label is written backwards relative to the qubit numbers.

---

### 2. What single gate is this circuit equivalent to?

```python
qc = QuantumCircuit(1)
qc.h(0)
qc.z(0)
qc.h(0)
```

- **A.** X
- **B.** Z
- **C.** Y
- **D.** Identity

**Answer: A.** X

**Why:** H swaps the X and Z bases, so a Z sandwiched between two H gates acts as an X. `Operator(qc).equiv(Operator(XGate()))` returns `True`. The same trick works the other way round: on hardware whose native two-qubit gate is CZ, a CX is just a CZ with an H on either side of the target.

**Step by step:**

1. Start in |0⟩, at the north pole.
2. H swings the arrow down to |+⟩, on the X axis.
3. Z turns it half a turn around the vertical axis, to |−⟩.
4. H again takes |−⟩ to |1⟩, the south pole. That's exactly where a single X would have sent |0⟩.

---

### 3. What does this print?

```python
from math import pi
from qiskit.circuit.library import RZGate, ZGate
from qiskit.quantum_info import Operator

a = Operator(RZGate(pi))
b = Operator(ZGate())
print(a == b, a.equiv(b))
```

- **A.** True True
- **B.** False False
- **C.** True False
- **D.** False True

**Answer: D.** False True

**Why:** RZ(π) is diag(−i, i), which is −i·Z. The two matrices are not equal, so `==` gives `False`. They differ only by a global phase, though, and `equiv` ignores global phase, so it gives `True`. Global phase never shows up in measurement results, which is why the transpiler can swap one gate for the other.

**Step by step:**

1. Start in |0⟩.
2. H gives |+⟩. Both amplitudes are +0.71.
3. RZ(π) lands on |−⟩, with amplitudes −0.71i and +0.71i. Z would give +0.71 and −0.71 instead. Each amplitude is multiplied by the same factor, −i. The arrow, the probabilities and the relative phase are all identical: only the global phase differs, so `==` says False and `equiv` says True.

---

### 4. What does this print?

```python
qc = QuantumCircuit(2)
qc.x(0)
qc.h(1)
print(Statevector(qc).probabilities_dict())
```

- **A.** {'10': 0.5, '11': 0.5}
- **B.** {'01': 0.5, '11': 0.5}
- **C.** {'00': 0.5, '01': 0.5}
- **D.** {'01': 1.0}

**Answer: B.** {'01': 0.5, '11': 0.5}

**Why:** Qubit 0 is always 1, and it is the rightmost character. Qubit 1 is in an equal superposition, so the leftmost character is 0 or 1 with equal odds. That gives '01' and '11'. If you picked {'10': 0.5, '11': 0.5}, you read the string with qubit 0 on the left. (The actual printout shows 0.4999999999999999 because of floating-point rounding.)

**Step by step:**

1. Both qubits start in 0, so all the probability sits on '00'.
2. X flips qubit 0. Qubit 0 is the rightmost character, so the bar moves to '01'.
3. H puts qubit 1, the leftmost character, into superposition. The bar splits evenly between '01' and '11'.

---

### 5. You're estimating what a circuit would cost on future error-corrected hardware, where some gates are cheap and others are very expensive. Which of these is not a Clifford gate?

- **A.** H
- **B.** S
- **C.** CX
- **D.** T

**Answer: D.** T

**Why:** Clifford gates map Pauli operators to other Pauli operators, and a circuit made only of them can be simulated efficiently on a classical computer (the Gottesman–Knill theorem). T is the standard non-Clifford gate. In fault-tolerant schemes it needs magic-state distillation, which is why resource estimates usually quote a T-count.

**Step by step:**

1. Start at |0⟩, which sits on an axis.
2. H, a Clifford gate, moves it to another axis point, |+⟩.
3. S, also Clifford, is a quarter turn to |+i⟩. Still on an axis.
4. T is an eighth of a turn. The arrow stops between two axes, at a point no combination of Clifford gates can reach from |0⟩. That's what makes T non-Clifford, and expensive on error-corrected hardware.

---

### 6. Logical qubits 0 and 4 need to interact, but they aren't neighbours on the chip, so the router inserts a SWAP. If the native entangling gate is CX, how many CX gates does one SWAP cost?

- **A.** 1
- **B.** 2
- **C.** 3
- **D.** 4

**Answer: C.** 3

**Why:** SWAP = CX(0,1) · CX(1,0) · CX(0,1). Transpiling a lone `swap` with `basis_gates=['cx', 'u']` gives exactly `{'cx': 3}`. Two-qubit gates are the noisiest operations on today's devices, so a bad initial layout gets expensive fast.

**Step by step:**

1. Start at '00'.
2. Prepare a test input: X on qubit 0 gives '01'.
3. CX(0,1): qubit 0 is 1, so qubit 1 flips. Now '11'.
4. CX(1,0): qubit 1 is 1, so qubit 0 flips. Now '10'.
5. CX(0,1): qubit 0 is now 0, so nothing happens. The 1 has moved from qubit 0 to qubit 1. That's a SWAP, and it took three CX gates.

---

### 7. Which statement is true?

- **A.** `cx(0, 1)` and `cx(1, 0)` are the same operator
- **B.** `cz(0, 1)` and `cz(1, 0)` are the same operator
- **C.** A CZ entangles |00⟩ with no other gates needed
- **D.** A SWAP can be built from a single CZ

**Answer: B.** `cz(0, 1)` and `cz(1, 0)` are the same operator

**Why:** CZ only puts a −1 phase on |11⟩, so it doesn't matter which qubit you call the control. CX is not symmetric. On |00⟩ a CZ does nothing at all, because you need a superposition first. A SWAP needs three two-qubit gates, not one.

**Step by step:**

1. At '00', a CZ would do nothing at all, so first spread the state out.
2. H on qubit 0.
3. H on qubit 1. All four states are equally likely, and every phase dial points right (+).
4. CZ flips the sign of '11' and nothing else. '11' reads the same whichever qubit you call the control, so cz(0, 1) and cz(1, 0) are the same gate.

---

### 8. What is the value of `sv.expectation_value(Pauli('X'))`?

```python
sv = Statevector.from_label("-")
```

- **A.** +1
- **B.** 0
- **C.** −1
- **D.** 0.5

**Answer: C.** −1

**Why:** |−⟩ is the −1 eigenstate of X. In practice you'll see something like `-0.9999999999999998` because of floating-point rounding, which you should treat as −1. The Z expectation value of the same state is 0.

**Step by step:**

1. Start at |0⟩. ⟨Z⟩ = +1 because the arrow points straight up.
2. X: now |1⟩, so ⟨Z⟩ = −1.
3. H takes |1⟩ to |−⟩, which points straight along −X. Its shadow on the X axis is the whole length in the negative direction, so ⟨X⟩ = −1. Its shadow on Z is zero, so ⟨Z⟩ = 0.

---

### 9. You're modelling a 4-site spin chain with a next-nearest-neighbour coupling between sites 1 and 3. Which dense Pauli label does this produce?

```python
SparsePauliOp.from_sparse_list([("ZZ", [1, 3], 1.0)], num_qubits=4)
```

- **A.** ZIZI
- **B.** IZIZ
- **C.** ZZII
- **D.** IIZZ

**Answer: A.** ZIZI

**Why:** `from_sparse_list` puts a Z on qubits 1 and 3. A dense label has qubit 3 on the far left and qubit 0 on the far right, so you get Z I Z I. IZIZ is the same mistake as in the `Pauli('XYZ')` question: reading the label with qubit 0 on the left.

**Step by step:**

1. The sparse form says: Z on qubits 1 and 3, and identity everywhere else. Here's the dense label it produces.
2. Qubit 0 gets the last character: I.
3. Qubit 1 gets a Z.
4. Qubit 2 gets an I.
5. Qubit 3 gets the first character: Z. Read left to right, that's ZIZI.

---

### 10. Hardware only measures in the computational (Z) basis. You want to know whether a qubit is in |+⟩ or |−⟩. What do you add just before `measure`?

- **A.** An X gate
- **B.** A Z gate
- **C.** A barrier
- **D.** An H gate

**Answer: D.** An H gate

**Why:** H maps |+⟩ to |0⟩ and |−⟩ to |1⟩, so H followed by a Z measurement is an X-basis measurement. For the Y basis you would add `sdg` and then `h`. The Estimator does this rotation for you behind the scenes whenever you ask for X or Y terms.

**Step by step:**

1. Start at |0⟩.
2. Prepare a test state. X first...
3. ...then H gives |−⟩. A Z measurement now gives 0 or 1 with 50/50 odds, which tells you nothing.
4. Add H just before measuring: |−⟩ turns onto |1⟩. Now a Z measurement gives 1 every time. Afterwards, 1 means it was |−⟩ and 0 means it was |+⟩.

---


## Section 2: Visualize circuits, measurements, and states

### 11. Which of these is not a valid `output` value for `QuantumCircuit.draw()`?

- **A.** "text"
- **B.** "mpl"
- **C.** "latex_source"
- **D.** "html"

**Answer: D.** "html"

**Why:** The supported outputs are `text`, `mpl`, `latex` and `latex_source`. `mpl` needs matplotlib installed. `latex` needs a working LaTeX install, while `latex_source` just gives you the .tex code to paste into a paper.

**Step by step:**

1. `draw('text')`: ASCII art. Works anywhere, even in a plain terminal ✓
2. `draw('mpl')`: a matplotlib figure, needs matplotlib ✓
3. `draw('latex')`: a rendered image, needs LaTeX installed ✓
4. `draw('latex_source')`: the .tex source as a string ✓
5. `draw('html')`: not an option, so it raises an error ✗

---

### 12. You prepare a Bell state and call `plot_bloch_multivector(Statevector(bell))`. What do you see?

- **A.** Both arrows point to +Z
- **B.** Both arrows point to +X
- **C.** No visible arrow on either sphere, because each qubit's Bloch vector has length zero
- **D.** One arrow up, one arrow down

**Answer: C.** No visible arrow on either sphere, because each qubit's Bloch vector has length zero

**Why:** `plot_bloch_multivector` draws each qubit's reduced state on its own sphere. In a maximally entangled state, each qubit on its own is maximally mixed, so its vector sits at the centre. The lesson is that Bloch spheres can't show entanglement. Use `plot_state_city` or `plot_state_qsphere` when you need the full state.

**Step by step:**

1. Two independent qubits, both pointing at |0⟩.
2. H on qubit 0 swings its arrow to +X. Qubit 1 hasn't moved.
3. CX entangles them, and both arrows shrink to the centre. Neither qubit has a state of its own any more: the information now lives in the correlations between them, and a Bloch sphere has no way to draw that.

---

### 13. After transpiling for a 127-qubit device, a reviewer asks which physical qubits your 5-qubit circuit landed on, shown on the chip's connectivity graph. Which call gives that picture?

- **A.** `plot_circuit_layout(isa_circuit, backend)`
- **B.** `plot_gate_map(backend)`
- **C.** `plot_histogram(counts)`
- **D.** `plot_state_qsphere(sv)`

**Answer: A.** `plot_circuit_layout(isa_circuit, backend)`

**Why:** `plot_circuit_layout` needs the transpiled circuit, because that's where the layout is stored, plus the backend. It then highlights the qubits you used. `plot_gate_map` draws the chip on its own, without any of your mapping.

**Step by step:**

1. During transpilation, each virtual qubit was given a physical home on the chip. `plot_circuit_layout` draws those choices.
2. q0 → physical 8
3. q1 → physical 9
4. q2 → physical 10
5. q3 → physical 16
6. q4 → physical 17. The transpiler picked a connected patch, so your CX gates need few SWAPs.

---

### 14. What does `qc.draw('mpl', reverse_bits=True)` change?

- **A.** It permanently reverses the qubit order in `qc`
- **B.** Only the picture: the highest-index qubit is drawn at the top
- **C.** The measurement results come back reversed
- **D.** Gates are drawn right to left

**Answer: B.** Only the picture: the highest-index qubit is drawn at the top

**Why:** Drawing options are cosmetic. People use `reverse_bits=True` to match textbook diagrams that put the most significant qubit on top. If you really want a circuit with reversed qubits, `qc.reverse_bits()` returns a new circuit, and that is a different thing.

**Step by step:**

1. The default drawing puts q0 on top.
2. With `reverse_bits=True`, q2 is on top. Every gate is still on the same qubit. H is still on q0 and X is still on q2. Only the picture moved.

---

### 15. You've reconstructed a `DensityMatrix` from tomography and want 3D bar charts of the real and imaginary parts of every element, to check whether the off-diagonal coherences survived. Which function?

- **A.** `plot_state_city`
- **B.** `plot_bloch_vector`
- **C.** `plot_distribution`
- **D.** `plot_error_map`

**Answer: A.** `plot_state_city`

**Why:** `plot_state_city` draws two 3D bar charts, one for the real part and one for the imaginary part. The diagonal holds populations and the off-diagonals hold coherences. Decoherence shows up as the off-diagonal bars shrinking. `plot_state_hinton` shows the same information as 2D squares.

**Step by step:**

1. The 16 elements of a 2-qubit density matrix. Each square's size shows how big that element is.
2. A clean Bell state. The populations are on the diagonal at 00 and 11, and the coherences are in the far corners.
3. Some decoherence: the corner squares shrink. The diagonal doesn't change, so a counts histogram wouldn't notice anything.
4. Mostly decohered. This is now close to a plain 50/50 classical mix of 00 and 11. `plot_state_city` makes this loss obvious at a glance.

---

### 16. Before spending QPU time, you want to steer clear of qubits with poor readout and links with bad two-qubit fidelity. Which visualization shows error rates laid out on the device graph?

- **A.** `plot_bloch_multivector`
- **B.** `plot_state_paulivec`
- **C.** `plot_error_map(backend)`
- **D.** `qc.draw('text')`

**Answer: C.** `plot_error_map(backend)`

**Why:** `plot_error_map` colours qubits and couplers by the error rates in the backend's calibration data. Devices are recalibrated regularly, so check it on the day you run, not the week before.

**Step by step:**

1. Today's calibration data for seven qubits.
2. The readout error for each one. `plot_error_map` paints these onto the chip layout, along with the two-qubit gate errors on each link.
3. These three are the ones to use today. After tomorrow's recalibration the best ones may be different.

---

### 17. You have counts from an ideal simulator and from hardware, and you want them as grouped bars in one chart. What works?

```python
plot_histogram([ideal_counts, hw_counts], legend=["ideal", "hardware"])
```

- **A.** This works: `plot_histogram` takes a list of count dicts and a legend
- **B.** You have to merge the dicts into one first
- **C.** `plot_histogram` only accepts a Statevector
- **D.** Only `plot_state_city` can compare two runs

**Answer: A.** This works: `plot_histogram` takes a list of count dicts and a legend

**Why:** `plot_histogram` takes either one dict or a list of them and draws grouped bars, which makes noise easy to see. If the two runs used different shot counts, `plot_distribution` normalises everything to probabilities, so the comparison is fair.

**Step by step:**

1. Two dicts, one chart.
2. Each bitstring gets a pair of bars: ideal on the left, hardware on the right.
3. The short bars at 01 and 10 are the noise. Side by side, you can see it straight away.

---


## Section 3: Create quantum circuits

### 18. What does `qc.measure_all()` do on a 3-qubit circuit with no classical bits?

- **A.** Measures into the default register `c`
- **B.** Adds a barrier, adds a new 3-bit classical register called `meas`, and measures every qubit into it
- **C.** Marks the qubits so they get measured at runtime
- **D.** Measures every qubit and then resets it

**Answer: B.** Adds a barrier, adds a new 3-bit classical register called `meas`, and measures every qubit into it

**Why:** This is why Sampler results for these circuits sit under `data.meas`. If you only want to measure qubits that actually have gates on them, use `measure_active()`.

**Step by step:**

1. Three qubits with some gates on them, and no classical bits yet.
2. First, `measure_all()` adds a barrier.
3. Then it adds a new 3-bit classical register called `meas`.
4. Then it measures every qubit into its own bit of `meas`.
5. That gives 3 classical bits, all in `meas`, which is why your Sampler counts are in `data.meas`.

---

### 19. What does this print?

```python
qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()
print(qc.num_clbits)
```

- **A.** 2
- **B.** 0
- **C.** 1
- **D.** 4

**Answer: D.** 4

**Why:** `QuantumCircuit(2, 2)` already has two classical bits in a register called `c`. `measure_all()` adds a new `meas` register by default, giving four in total. With SamplerV2 you'd find an all-zero `data.c` next to your real results in `data.meas`. Use `measure_all(add_bits=False)` or an explicit `measure([0, 1], [0, 1])` instead.

**Step by step:**

1. `QuantumCircuit(2, 2)` already has a 2-bit register called `c`.
2. `measure_all()` adds its barrier...
3. ...and then a new register called `meas`. It doesn't reuse `c`.
4. The measurements go into `meas`. Nothing is ever written to `c`.
5. `num_clbits` is 4. The two bits in `c` stay 0 on every shot.

---

### 20. What does this print?

```python
t = Parameter("t")
qc = QuantumCircuit(1)
qc.rx(t, 0)
bound = qc.assign_parameters({t: 0.3})
print(qc.num_parameters, bound.num_parameters)
```

- **A.** 0 0
- **B.** 1 1
- **C.** 1 0
- **D.** 0 1

**Answer: C.** 1 0

**Why:** `assign_parameters` returns a new circuit by default (`inplace=False`), so the original stays a reusable template. Usually that's what you want. Often you don't need to bind values yourself at all, because the primitives take parameter values directly in the PUB.

**Step by step:**

1. Start with a template circuit.
2. `assign_parameters` makes a copy by default (`inplace=False`).
3. The copy gets the value filled in.
4. The original stays as it was, ready for the next value. So the output is `1 0`.

---

### 21. How many parameters does this circuit have?

```python
theta = ParameterVector("θ", 3)
qc = QuantumCircuit(2)
qc.ry(theta[0], 0)
qc.ry(theta[2], 1)
qc.rz(theta[0], 1)
print(qc.num_parameters)
```

- **A.** 3
- **B.** 1
- **C.** 2
- **D.** 4

**Answer: C.** 2

**Why:** `num_parameters` counts the unique unbound parameters that appear in the circuit. θ[1] is never used, and θ[0] counts once even though it appears twice. When you pass values to a primitive, you supply exactly this many, in the order of `qc.parameters`.

**Step by step:**

1. `θ[0]`: used in ry on q0, so it counts ✓
2. `θ[1]`: never used, so it isn't part of the circuit ✗
3. `θ[2]`: used in ry on q1, so it counts ✓
4. `θ[0] again`: in rz on q1, but it's already counted ✗
5. `num_parameters = 2`

---

### 22. Where does the H gate end up?

```python
big = QuantumCircuit(3)
small = QuantumCircuit(2)
small.h(0)
small.cx(0, 1)
out = big.compose(small, qubits=[2, 0])
```

- **A.** Qubit 2
- **B.** Qubit 0
- **C.** Qubit 1
- **D.** Qubits 2 and 0

**Answer: A.** Qubit 2

**Why:** The `qubits` list maps the small circuit's qubits, in order, onto the big one: small qubit 0 goes to big qubit 2, and small qubit 1 goes to big qubit 0. So H lands on qubit 2, and the CX becomes `cx(2, 0)`.

**Step by step:**

1. Each position in `qubits=[2, 0]` says where one of the small circuit's qubits goes.
2. Position 0 holds a 2, so small q0 goes to big q2. That's where H lands.
3. Position 1 holds a 0, so small q1 goes to big q0. The CX becomes `cx(2, 0)`, and big q1 isn't touched.

---

### 23. A teammate writes `qc.compose(oracle)` and then adds measurements, but the oracle isn't in the drawn circuit. Why?

- **A.** `compose` only works with single gates, not circuits
- **B.** `compose` returns a new circuit. Either reassign (`qc = qc.compose(oracle)`) or pass `inplace=True`
- **C.** `compose` needs a barrier before it
- **D.** The oracle has to be transpiled first

**Answer: B.** `compose` returns a new circuit. Either reassign (`qc = qc.compose(oracle)`) or pass `inplace=True`

**Why:** Like `assign_parameters`, `compose` leaves the original alone unless you ask otherwise. It's an easy bug to miss because nothing raises an error. The oracle silently goes nowhere.

**Step by step:**

1. `qc`: no oracle
2. `qc.compose(oracle)`: builds a new circuit...
3. `new circuit`: ...that nothing keeps ✗
4. `qc`: still no oracle ✗
5. `qc = qc.compose(oracle)`: or pass inplace=True ✓

---

### 24. What are `qc.depth()` and `qc.size()` here?

```python
qc = QuantumCircuit(3)
qc.h(0); qc.h(1); qc.h(2)
qc.cx(0, 1)
qc.cx(1, 2)
```

- **A.** depth 5, size 5
- **B.** depth 2, size 5
- **C.** depth 3, size 3
- **D.** depth 3, size 5

**Answer: D.** depth 3, size 5

**Why:** The three H gates run in parallel, so they take one layer. `cx(0, 1)` is layer two. `cx(1, 2)` has to wait for qubit 1, so it's layer three. Size is simply the total number of operations, which is five.

**Step by step:**

1. Nothing has run yet: depth 0, size 0.
2. Layer 1: the three H gates are on different qubits, so they run side by side. Depth 1, size 3.
3. Layer 2: cx(0, 1) needs qubits 0 and 1, which are free now. Depth 2, size 4.
4. Layer 3: cx(1, 2) has to wait until cx(0, 1) releases qubit 1. Depth 3, size 5.

---

### 25. An older notebook uses `qc.x(1).c_if(cr, 1)` for a teleportation correction. What's the Qiskit 2.x way to write it?

```python
# the context-manager form
with qc.if_test((qc.clbits[0], 1)):
    qc.x(1)
```

- **A.** The `if_test` context manager shown above
- **B.** Keep `c_if`, since it still works
- **C.** `qc.x(1, condition=1)`
- **D.** `qc.conditional(XGate(), 1)`

**Answer: A.** The `if_test` context manager shown above

**Why:** `c_if` was removed in Qiskit 2.0. Classical control flow now uses context managers: `if_test`, `for_loop`, `while_loop` and `switch`. On IBM hardware these run as dynamic circuits, with mid-circuit measurement and feed-forward, which you need for teleportation and error-correction experiments.

**Step by step:**

1. Start at '00'.
2. H on qubit 0: '00' and '01' at 50% each.
3. A mid-circuit measurement. This shot read c[0] = 0 or 1, and the state collapsed to match.
4. `if_test` checks whether c[0] == 1. The X only fires when c[0] is 1, so qubit 1 now matches qubit 0 either way.

---

### 26. You computed a value into an ancilla, used it, and now need the ancilla back in |0⟩ without disturbing the data qubits it is entangled with. What do you do?

- **A.** `qc.reset(ancilla)`
- **B.** Append the inverse of the block that computed it: `qc.compose(compute.inverse(), inplace=True)`
- **C.** Add a barrier
- **D.** Measure the ancilla and ignore the result

**Answer: B.** Append the inverse of the block that computed it: `qc.compose(compute.inverse(), inplace=True)`

**Why:** `inverse()` reverses the gate order and takes the adjoint of each gate, so it undoes the computation coherently. Reset and measurement both collapse the ancilla, and because it's entangled with the data qubits they damage those too. That ruins the interference that algorithms like Grover rely on.

**Step by step:**

1. Qubits 0 and 1 hold the data, and qubit 2 is the ancilla. Everything starts at 0.
2. H on qubit 0...
3. ...and H on qubit 1. There are four data states in superposition, and the ancilla (the leftmost bit) is still 0.
4. Compute: CCX writes 'q0 AND q1' into the ancilla, so '011' becomes '111'.
5. Use: Z on the ancilla flips the sign of '111', the one state where the AND was true.
6. Uncompute: the same CCX again (it's its own inverse) clears the ancilla. It's back to 0 in every term, the superposition survives, and the minus sign stays on '011'. A reset or measurement would have collapsed all of that.

---

### 27. How many parameters does `real_amplitudes(4, reps=2)` have?

```python
from qiskit.circuit.library import real_amplitudes
ansatz = real_amplitudes(4, reps=2)
```

- **A.** 8
- **B.** 16
- **C.** 6
- **D.** 12

**Answer: D.** 12

**Why:** There is one layer of RY rotations per repetition plus a final layer, so the count is num_qubits × (reps + 1) = 4 × 3 = 12. Recent Qiskit 2.x releases favour the lowercase function forms such as `real_amplitudes` and `efficient_su2` over the older `RealAmplitudes` and `EfficientSU2` classes.

**Step by step:**

1. Four qubits, two repetitions.
2. The first RY layer: one parameter per qubit, 4 so far.
3. The CX chain entangles the qubits and adds no parameters.
4. RY layer for repetition 1: 8 so far.
5. Another CX chain.
6. The final RY layer: 12 parameters, which is 4 × (2 + 1).

---

### 28. What does `count_ops()` return after this circuit is transpiled at optimization level 3?

```python
qc = QuantumCircuit(1)
qc.x(0)
qc.barrier()
qc.x(0)
isa = transpile(qc, basis_gates=["x", "rz", "sx"], optimization_level=3)
```

- **A.** {} (empty)
- **B.** {'x': 1}
- **C.** {'x': 2, 'barrier': 1}
- **D.** It raises an error

**Answer: C.** {'x': 2, 'barrier': 1}

**Why:** Without the barrier, the two X gates cancel and the transpiler hands you an empty circuit. The barrier stops optimisation from crossing it, so both gates survive. That's handy in echo and benchmarking experiments, where you want those 'useless' gates kept on purpose.

**Step by step:**

1. The same two X gates, once without a barrier and once with one in between.
2. The optimiser pushes them together. Without a barrier they meet. With one, they can't cross it.
3. X·X = I, so the first pair cancels to `{}`. The second pair survives: `{'x': 2, 'barrier': 1}`.

---


## Section 4: Run quantum circuits

### 29. You send a circuit containing `h` and `ccx` straight to SamplerV2 on an IBM backend, and it is rejected because it contains instructions the target doesn't support. What's the fix?

```python
pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
isa_circuit = pm.run(qc)
```

- **A.** Increase the shot count
- **B.** Transpile to an ISA circuit first, as shown
- **C.** Remove all measurements
- **D.** Open a Session

**Answer: B.** Transpile to an ISA circuit first, as shown

**Why:** IBM Runtime only accepts ISA circuits, meaning circuits that use the backend's native gates and respect its connectivity. It won't transpile for you. A preset pass manager is the usual way to produce one.

**Step by step:**

1. Your circuit, written with convenient high-level gates.
2. Runtime won't translate it for you, so it rejects the job.
3. The pass manager rewrites it for this particular device...
4. ...using only native gates on qubits that are actually connected.
5. Now the job goes through.

---

### 30. You call `transpile(qc, backend=backend)` without setting `optimization_level`. Which level does Qiskit 2.x use?

- **A.** 0
- **B.** 1
- **C.** 2
- **D.** 3

**Answer: C.** 2

**Why:** The default moved from 1 to 2 back in Qiskit 1.3, and `generate_preset_pass_manager` also defaults to 2. Level 3 searches harder and takes longer to compile, which is often worth it for deep circuits that will run many times.

**Step by step:**

1. level 0: `no optimisation`: just make it run
2. level 1: `light`: the default until Qiskit 1.3
3. level 2: `default now`: a good balance
4. level 3: `heaviest`: slower to compile

---

### 31. You're running VQE: hundreds of short Estimator calls, each depending on the result of the last. Which execution mode fits best?

- **A.** Session
- **B.** Batch
- **C.** Job mode, one job at a time
- **D.** Local simulator only

**Answer: A.** Session

**Why:** A session keeps the QPU available to you between iterations, so you don't rejoin the queue for every optimiser step. Sessions aren't available on the free Open plan, so if that's your plan you'll be using job or batch mode.

**Step by step:**

1. The same five optimiser steps, run two different ways.
2. In job mode, every step goes back to the end of the queue.
3. Other users' jobs fill the gaps while your optimiser waits.
4. In a session, the device waits for your optimiser between steps.
5. The session finished long ago, and job mode is still going.
6. With hundreds of iterations, that difference adds up to hours.

---

### 32. You need to run 300 independent characterisation circuits, and none depends on another's result. Which mode makes the most sense?

- **A.** Session
- **B.** A loop that submits one job per circuit
- **C.** Local simulator
- **D.** Batch

**Answer: D.** Batch

**Why:** Batch is meant for independent jobs. The scheduler can overlap their classical pre- and post-processing, and you don't hold the device idle between them as you would in a session.

**Step by step:**

1. The circuits are independent, so the order doesn't matter.
2. Submitted one at a time, each job waits in the queue separately.
3. As a batch they're scheduled together, and their classical prep overlaps.
4. Unlike a session, nothing waits on a previous result, so there's no reserved idle time.
5. The batch is done in about half the time.

---

### 33. You want to dry-run your whole pipeline with realistic device noise, without spending any QPU time. What works?

```python
from qiskit_ibm_runtime import SamplerV2
from qiskit_ibm_runtime.fake_provider import FakeSherbrooke
```

- **A.** `SamplerV2(mode=FakeSherbrooke())`
- **B.** `QiskitRuntimeService(channel='fake')`
- **C.** `execute(qc, 'fake')`
- **D.** It isn't possible without real hardware

**Answer: A.** `SamplerV2(mode=FakeSherbrooke())`

**Why:** If you pass a fake backend as the `mode`, the primitives run in local testing mode on Aer, using a noise model taken from a snapshot of that device. You need `qiskit-aer` installed. The snapshot is old, so don't expect the numbers to match today's device.

**Step by step:**

1. `SamplerV2(mode=FakeSherbrooke())`
2. `Aer simulator`: running on your machine
3. `+ noise model`: from a calibration snapshot
4. `noisy counts`: and zero QPU time used ✓

---

### 34. Which call picks the real device with the shortest queue?

- **A.** `service.backends()[0]`
- **B.** `service.fastest()`
- **C.** `service.least_busy(operational=True, simulator=False)`
- **D.** `AerSimulator()`

**Answer: C.** `service.least_busy(operational=True, simulator=False)`

**Why:** `least_busy` sorts by pending jobs. The shortest queue isn't always the best choice, though. A device with better error rates on the qubits you need can be worth the wait.

**Step by step:**

1. Four real devices you have access to.
2. `least_busy()` looks at how many jobs are waiting on each one...
3. ...and returns the one with the shortest queue. Check its error rates before you commit to it.

---

### 35. An old tutorial runs circuits with `execute(qc, backend)`. What's the Qiskit 2.x approach?

- **A.** `execute` still works
- **B.** Transpile to ISA, then call `SamplerV2(mode=backend).run([isa])` or the Estimator equivalent
- **C.** `qc.run(backend)`
- **D.** `backend.execute(qc)`

**Answer: B.** Transpile to ISA, then call `SamplerV2(mode=backend).run([isa])` or the Estimator equivalent

**Why:** `execute` was removed in Qiskit 1.0, and the V1 `Sampler` and `Estimator` reference classes were removed in 2.0. For exact local results, use `StatevectorSampler` and `StatevectorEstimator`. For hardware, use the Runtime V2 primitives.

**Step by step:**

1. `execute(qc, backend)`: removed in 1.0 ✗
2. `Sampler() (V1)`: removed in 2.0 ✗
3. `transpile to ISA`
4. `SamplerV2(mode=backend).run([isa])` ✓

---

### 36. Your circuit has 3 qubits. After `pm.run(qc)` for a 127-qubit device, `isa.num_qubits` prints 127. What happened?

- **A.** The circuit was widened to the full device. Your 3 virtual qubits are mapped onto 3 physical ones, and the rest sit idle
- **B.** The transpiler hit an error
- **C.** You'll be billed 127× the shots
- **D.** The circuit was copied 42 times

**Answer: A.** The circuit was widened to the full device. Your 3 virtual qubits are mapped onto 3 physical ones, and the rest sit idle

**Why:** ISA circuits are defined on the device's physical qubits. Which physical qubits you got is stored in `isa.layout`. This matters as soon as you use the Estimator, because your observables have to be widened the same way.

**Step by step:**

1. Your circuit has three virtual qubits. The ISA circuit is written over the whole device.
2. q0 → physical 14
3. q1 → physical 15
4. q2 → physical 25. All the other physical qubits are still part of the ISA circuit, they just have no gates on them. That's why `num_qubits` says 127.

---

### 37. An H gate is transpiled for a backend whose basis is `{rz, sx, x, cz}`. What comes out?

- **A.** `h`, unchanged
- **B.** `x` followed by `z`
- **C.** A `cz`
- **D.** `rz`, `sx`, `rz`

**Answer: D.** `rz`, `sx`, `rz`

**Why:** H = RZ(π/2) · SX · RZ(π/2), up to a global phase. On IBM hardware RZ is a virtual frame change and costs essentially nothing, so the real cost of a single-qubit gate is roughly its number of SX and X pulses.

**Step by step:**

1. Start at |0⟩. H would take this to |+⟩, on the X axis.
2. RZ(π/2) turns the arrow about the axis it already points along, so nothing visible happens. On IBM hardware an RZ costs nothing anyway.
3. SX is a quarter turn about X, which takes the arrow to −Y. This is the only physical pulse in the sequence.
4. Another RZ(π/2), a quarter turn about Z, brings it to +X, which is |+⟩. That's exactly where H would have put it.

---


## Section 5: Use the Sampler primitive

### 38. You built your circuit with `measure_all()` and ran it with `sampler.run([qc])`. How do you get the counts?

- **A.** `result.get_counts()`
- **B.** `result[0].data.meas.get_counts()`
- **C.** `result[0].quasi_dists`
- **D.** `result.data['counts']`

**Answer: B.** `result[0].data.meas.get_counts()`

**Why:** With V2 primitives you go step by step: the `PrimitiveResult`, then `[0]` for the first PUB, then `.data`, then the classical register name, which gives you a `BitArray`. `quasi_dists` belonged to the old V1 Sampler.

**Step by step:**

1. `result`: PrimitiveResult
2. `[0]`: the first PUB
3. `.data`: DataBin
4. `.meas`: BitArray, named after the register
5. `.get_counts()`: {'00': 517, '11': 507} ✓

---

### 39. Your circuit was built as `QuantumCircuit(2, 2)` and measured with `qc.measure([0, 1], [0, 1])`. Calling `result[0].data.meas` raises `AttributeError`. Why?

- **A.** The Sampler drops explicit measurements
- **B.** You need `measure_all()` for the Sampler to work
- **C.** The register is called `c`, so use `result[0].data.c`
- **D.** The shot count was too low

**Answer: C.** The register is called `c`, so use `result[0].data.c`

**Why:** When you create a circuit as `QuantumCircuit(n, m)`, the classical register is named `c`. If you're not sure, `list(result[0].data.keys())` tells you exactly which registers came back.

**Step by step:**

1. You're at the DataBin.
2. `meas` only exists if `measure_all()` created it.
3. Asking the DataBin which registers it holds settles it.
4. Use the register that's actually there.

---

### 40. Which call runs this circuit for exactly 500 shots?

- **A.** `sampler.run([(qc, None, 500)])`
- **B.** `sampler.run([qc, 500])`
- **C.** `sampler.run(qc, 500)`
- **D.** `sampler.run([(500, qc)])`

**Answer: A.** `sampler.run([(qc, None, 500)])`

**Why:** A Sampler PUB is `(circuit, parameter_values, shots)`. You can also write `sampler.run([qc], shots=500)`, which applies to every PUB that doesn't set its own. A per-PUB value wins. `[qc, 500]` would make 500 a second PUB, which fails.

**Step by step:**

1. A Sampler PUB has three slots, always in this order.
2. This circuit has no parameters, so the second slot is None.
3. Shots go in the third slot: `sampler.run([(qc, None, 500)])`.

---

### 41. You run `StatevectorSampler().run([qc])` without setting shots. How many shots do you get?

- **A.** 1000
- **B.** 1024
- **C.** 4096
- **D.** None. It returns exact probabilities

**Answer: B.** 1024

**Why:** `default_shots` is 1024. Even though it's built on an exact statevector, it still samples, so the counts wobble from run to run. Pass `seed=` if you need reproducible numbers in a test, or use `Statevector.probabilities_dict()` for the exact values.

**Step by step:**

1. No shots yet. With no `shots=` argument, StatevectorSampler takes 1024.
2. All 1024 shots are in. It's close to 50/50 but not exact, because it really is sampling.

---

### 42. You're sweeping a rotation angle for a Rabi-style calibration. The circuit has one parameter and you pass a values array of shape (20, 1) in a single PUB. What is `result[0].data.meas.shape`?

- **A.** (20, 1)
- **B.** (1,)
- **C.** (20,)
- **D.** (1024, 20)

**Answer: C.** (20,)

**Why:** The last axis of the parameter array holds the circuit's parameters, which is one here. Whatever is left, (20,), is the shape of the PUB, so you get one `BitArray` slice per angle. `get_counts(loc=7)` gives the counts for the eighth angle. That's one PUB instead of twenty separate jobs.

**Step by step:**

1. 20 angles, each a little list holding the circuit's one parameter.
2. The last axis is used up by that parameter...
3. ...and what's left, (20,), is the shape of the result: one BitArray per angle. `get_counts(loc=7)` is the eighth.

---

### 43. Which of these lines is not a valid option on Qiskit Runtime's `SamplerV2`?

- **A.** `sampler.options.default_shots = 4000`
- **B.** `sampler.options.dynamical_decoupling.enable = True`
- **C.** `sampler.options.twirling.enable_gates = True`
- **D.** `sampler.options.resilience_level = 1`

**Answer: D.** `sampler.options.resilience_level = 1`

**Why:** `resilience_level` is an Estimator option. The Sampler supports error suppression such as dynamical decoupling and Pauli twirling, but not the readout mitigation and ZNE levels you get with the Estimator.

**Step by step:**

1. `default_shots`: how many shots to take ✓
2. `dynamical_decoupling`: pulse sequences that protect idle qubits ✓
3. `twirling`: turns coherent errors into random noise ✓
4. `resilience_level`: Estimator only ✗

---

### 44. Your circuit measures into two registers, `alice` and `bob`, and you want one combined bitstring per shot. Which call gives you that?

- **A.** `result[0].join_data().get_counts()`
- **B.** `result[0].data.alice + result[0].data.bob`
- **C.** `result.get_counts(all=True)`
- **D.** You can't do this with V2 results

**Answer: A.** `result[0].join_data().get_counts()`

**Why:** `join_data()` concatenates the registers into a single `BitArray`. The register added later sits on the left, the same little-endian convention as qubits. With `alice = 0` and `bob = 1`, you get `'10'`.

**Step by step:**

1. `join_data()` merges both registers into one bitstring.
2. The rightmost bit comes from `alice`, the register added first. She measured 0.
3. `bob` was added second, so his bit goes on the left: 1. Combined, that's '10'.

---


## Section 6: Use the Estimator primitive

### 45. What is the layout of an Estimator PUB?

- **A.** `(circuit, observables, parameter_values, precision)`
- **B.** `(observables, circuit)`
- **C.** `(circuit, shots, observables)`
- **D.** `(circuit, parameter_values, shots)`

**Answer: A.** `(circuit, observables, parameter_values, precision)`

**Why:** Only the circuit and the observables are required. `(circuit, parameter_values, shots)` is a Sampler PUB, which is an easy one to mix up. Results come back as `result[0].data.evs` for the values and `result[0].data.stds` for their standard errors.

**Step by step:**

1. The circuit always goes first.
2. Observables come second. This is the difference from a Sampler PUB, where the second slot is parameter values.
3. Next come the parameter values, if your circuit has any.
4. Last is the target precision, if you want something other than the default.

---

### 46. You transpile a 2-qubit ansatz for a 127-qubit backend, then run `estimator.run([(isa, SparsePauliOp('ZZ'))])`. It fails because the observable doesn't match the circuit. What's the right fix?

- **A.** Pad it with identities: `SparsePauliOp('I' * 125 + 'ZZ')`
- **B.** `observable.apply_layout(isa.layout)`
- **C.** Transpile the observable with the pass manager
- **D.** Set `resilience_level = 0`

**Answer: B.** `observable.apply_layout(isa.layout)`

**Why:** Padding with identities makes the sizes match, but it puts ZZ on physical qubits 0 and 1, and the router may well have placed your qubits somewhere else. `apply_layout` handles both the widening and the permutation.

**Step by step:**

1. Your ZZ observable acts on virtual qubits 0 and 1.
2. Padding with identities puts the first Z on physical qubit 0...
3. ...and the second on physical qubit 1. But your circuit doesn't live there.
4. `apply_layout` follows the layout instead. q0 actually ended up on physical 13...
5. ...and q1 on physical 14. Now the observable measures the qubits that actually hold your state.

---

### 47. For the Bell state (|00⟩ + |11⟩)/√2, what are the ideal expectation values of ZZ, XX and ZI?

```python
bell = QuantumCircuit(2)
bell.h(0)
bell.cx(0, 1)
estimator.run([(bell, ["ZZ", "XX", "ZI"])])
```

- **A.** [1, 0, 0]
- **B.** [0.5, 0.5, 0]
- **C.** [1, −1, 0]
- **D.** [1, 1, 0]

**Answer: D.** [1, 1, 0]

**Why:** The two qubits are perfectly correlated in both the Z and X bases, but each qubit on its own is completely random. Measuring ZZ and XX together is a cheap way to check entanglement on real hardware: if both come back close to 1, your Bell pair is in good shape.

**Step by step:**

1. At |00⟩, ZZ = 1 and ZI = 1, but XX = 0.
2. After H on qubit 0, ZZ and XX are both 0. ZI (Z on qubit 1) is still 1, because qubit 1 hasn't been touched.
3. After CX you have the Bell state: ZZ = 1 and XX = 1, perfectly correlated in both bases, while ZI drops to 0 because each qubit on its own is now random.

---

### 48. Observables are passed as an array of shape (3, 1) and parameter values as shape (20, 1) for a one-parameter circuit. What shape is `result[0].data.evs`?

```python
estimator.run([(qc, [["ZZ"], ["XX"], ["ZI"]], values)])  # values.shape == (20, 1)
```

- **A.** (20,)
- **B.** (3,)
- **C.** (3, 20)
- **D.** (60, 1)

**Answer: C.** (3, 20)

**Why:** The parameter array has a broadcast shape of (20,), and NumPy broadcasting of (3, 1) with (20,) gives (3, 20). So you get every observable at every angle, 60 numbers from one PUB.

**Step by step:**

1. Three observables stacked as a column, and twenty angles laid out as a row.
2. NumPy broadcasting stretches each one along the other's axis...
3. ...giving every observable at every angle: 60 expectation values from a single PUB.

---

### 49. What does `resilience_level = 1`, the Runtime Estimator default, apply?

- **A.** No mitigation at all
- **B.** Readout error mitigation (TREX)
- **C.** Zero-noise extrapolation
- **D.** Full probabilistic error cancellation

**Answer: B.** Readout error mitigation (TREX)

**Why:** Level 0 applies nothing. Level 1 adds TREX for readout errors. Level 2 adds zero-noise extrapolation and gate twirling on top. Each step up costs more runtime and usually increases the variance, so only go higher when the bias is actually hurting you.

**Step by step:**

1. `level 0`: no mitigation
2. `level 1 (default)`: + TREX readout-error mitigation
3. `level 2`: + zero-noise extrapolation and gate twirling

---

### 50. You're computing the energy of a small transverse-field Ising model on the state |00⟩. What does the Estimator return?

```python
H = SparsePauliOp.from_list([("ZZ", 0.5), ("IX", 0.5)])
estimator.run([(QuantumCircuit(2), H)])
```

- **A.** 0.5
- **B.** 1.0
- **C.** 0
- **D.** −0.5

**Answer: A.** 0.5

**Why:** Expectation values are linear, so the energy is 0.5·⟨ZZ⟩ + 0.5·⟨IX⟩ = 0.5·1 + 0.5·0. Remember that `IX` puts the X on qubit 0. This number is exactly what a VQE loop tries to minimise.

**Step by step:**

1. |00⟩ is a +1 eigenstate of ZZ, so the first term is 0.5 × 1.
2. X on qubit 0 of |0⟩ averages to 0, so the second term contributes nothing.
3. The weighted terms add up to 0.5. In VQE, the optimiser keeps changing the circuit to push this number down.

---

### 51. Your Estimator result has a standard error of about 0.02. Roughly how many more shots do you need to bring it down to 0.01?

- **A.** 2×
- **B.** 10×
- **C.** 100×
- **D.** 4×

**Answer: D.** 4×

**Why:** Shot noise falls as 1/√N, so halving the error takes four times the shots. On hardware, mitigation adds its own sampling overhead on top of that, so budget accordingly.

**Step by step:**

1. 1,000 shots give a standard error of 0.02.
2. Doubling to 2,000 shots only gets you to about 0.014.
3. Quadrupling to 4,000 shots gets you to 0.01. Error falls as 1/√N, so halving it costs four times the shots.

---


## Section 7: Retrieve and analyze results

### 52. You submitted a hardware job yesterday and closed your notebook. You saved the job ID. How do you get the results now?

- **A.** Re-run the circuit
- **B.** `job.restore()`
- **C.** `service.job('<job_id>').result()`
- **D.** `QiskitRuntimeService.load('<job_id>')`

**Answer: C.** `service.job('<job_id>').result()`

**Why:** This is why you should always print or log `job.job_id()` when you submit. IBM keeps results for a while, but without the ID you'll be digging through the dashboard to find them.

**Step by step:**

1. `sampler.run(...)`: Monday
2. `job.job_id()`: write it down!
3. `notebook closed`: the job object is gone
4. `service.job(id).result()`: Tuesday ✓

---

### 53. `job.status()` returns `'QUEUED'`. What does that mean?

- **A.** The job failed
- **B.** It's waiting for its turn on the device and nothing has run yet
- **C.** It's running right now
- **D.** It finished, but the results expired

**Answer: B.** It's waiting for its turn on the device and nothing has run yet

**Why:** After QUEUED you'll typically see RUNNING and then DONE, or ERROR or CANCELLED if something went wrong. `job.result()` blocks until the job finishes, so you don't need a polling loop if you're happy to wait.

**Step by step:**

1. `INITIALIZING`: being validated
2. `QUEUED`: you are here: waiting your turn
3. `RUNNING`: on the QPU
4. `DONE`: results ready ✓

---

### 54. A Bell circuit on hardware returns these counts. What fraction of shots landed on the outcomes you'd expect?

```python
{'00': 480, '11': 470, '01': 28, '10': 46}
```

- **A.** ≈ 0.928
- **B.** 0.950
- **C.** ≈ 0.072
- **D.** ≈ 0.469

**Answer: A.** ≈ 0.928

**Why:** The total is 1024 shots, not 1000, so it's (480 + 470) / 1024 ≈ 0.928. 0.950 is what you get if you assume 1000 shots. Keep in mind that this is only a Z-basis check. A mixed state of 00 and 11 would score just as well, so to confirm real entanglement you also need the XX correlation.

**Step by step:**

1. A noisy Bell circuit. First check the total: 480 + 28 + 46 + 470 = 1024, not 1000.
2. One bar per bitstring.
3. 00 + 11 = 950 out of 1024, which is about 0.928. The other 74 shots are noise.

---

### 55. Your report needs error bars on each Estimator expectation value. Where do they come from?

- **A.** `result[0].metadata['shots']`
- **B.** `job.status()`
- **C.** `result[0].data.evs ** 2`
- **D.** `result[0].data.stds`

**Answer: D.** `result[0].data.stds`

**Why:** `stds` has the same shape as `evs` and gives the standard error of each value. If you report an expectation value without one, a reviewer will rightly ask for it.

**Step by step:**

1. Three observables from a Bell-state experiment.
2. The bars are `data.evs`, and the whiskers are `data.stds`, which has the same shape and gives one error per value.

---

### 56. You want to check whether readout errors drift during a long run, so you need every shot's outcome in order, not totals. Which `BitArray` method gives you that?

- **A.** `get_counts()`
- **B.** `get_bitstrings()`
- **C.** `get_int_counts()`
- **D.** `num_shots`

**Answer: B.** `get_bitstrings()`

**Why:** Counts add everything up and throw away the order. `get_bitstrings()` returns one string per shot, so you can slice it into windows and compare them.

**Step by step:**

1. `get_bitstrings()` hands you one string per shot, in the order they were taken.
2. The first eight shots are all clean.
3. In the middle, the first error shows up.
4. Near the end, errors (in red) come more often. That's drift.
5. `get_counts()` adds everything up. The totals are the same, but you can no longer tell when the errors happened.

---

### 57. What counts does this produce?

```python
qc = QuantumCircuit(3)
qc.x(0)
qc.measure_all()
StatevectorSampler().run([qc]).result()[0].data.meas.get_counts()
```

- **A.** {'100': 1024}
- **B.** {'010': 1024}
- **C.** {'001': 1024}
- **D.** {'1': 1024}

**Answer: C.** {'001': 1024}

**Why:** Qubit 0 is the rightmost character in the bitstring. If you post-process counts by indexing into the string, remember that `bitstring[-1]` is qubit 0, not `bitstring[0]`.

**Step by step:**

1. Every shot gives the same key, '001'. Which character is which qubit?
2. The rightmost character is qubit 0, the one that got the X. It reads 1.
3. Qubit 1 reads 0.
4. The leftmost character is qubit 2, which reads 0. So in Python, `bitstring[-1]` is qubit 0.

---


## Section 8: Operate with OpenQASM

### 58. You need to hand a circuit with an `if_test` block to a partner team as plain text. Which export works?

- **A.** `qasm3.dumps(qc)`
- **B.** `qasm2.dumps(qc)`
- **C.** `qc.draw('text')`
- **D.** `str(qc)`

**Answer: A.** `qasm3.dumps(qc)`

**Why:** OpenQASM 2 only has the old register-equality `if`, so `qasm2.dumps` raises `QASM2ExportError` on this circuit. OpenQASM 3 handles it fine, and the output contains `if (c[0]) { x q[1]; }`.

**Step by step:**

1. `a circuit with if_test`: a measurement feeds a later gate
2. `qasm2.dumps(qc)`: QASM2ExportError: only register-equality conditions ✗
3. `qasm3.dumps(qc)`: if (c[0]) { x q[1]; } ✓

---

### 59. `qiskit.qasm3.loads(program)` raises `MissingOptionalLibraryError`. What's going on?

- **A.** Qiskit can't import OpenQASM 3 at all
- **B.** You have to use `QuantumCircuit.from_qasm_str` instead
- **C.** The file must end in `.qasm`
- **D.** Importing needs the optional `qiskit-qasm3-import` package

**Answer: D.** Importing needs the optional `qiskit-qasm3-import` package

**Why:** Exporting to OpenQASM 3 is built in, but importing it needs `pip install qiskit-qasm3-import`. `QuantumCircuit.from_qasm_str` only reads OpenQASM 2, so it won't help with a 3.0 program.

**Step by step:**

1. `qasm3.dumps(qc)`: export is built in ✓
2. `qasm3.loads(text)`: MissingOptionalLibraryError ✗
3. `pip install qiskit-qasm3-import`
4. `qasm3.loads(text)`: works ✓

---

### 60. After you import this program into Qiskit, what does `input float theta;` become?

```qasm
OPENQASM 3.0;
include "stdgates.inc";
input float theta;
qubit[1] q;
bit[1] c;
rx(theta) q[0];
c[0] = measure q[0];
```

- **A.** A constant fixed at 0.0
- **B.** A `Parameter` named `theta` that you bind later, for example in the PUB
- **C.** A classical register
- **D.** A syntax error, because OpenQASM 3 has no inputs

**Answer: B.** A `Parameter` named `theta` that you bind later, for example in the PUB

**Why:** `input` declarations are how OpenQASM 3 expresses values supplied at runtime, and they come into Qiskit as ordinary circuit parameters. That means a parameterised circuit can make the round trip through QASM without losing its parameters.

**Step by step:**

1. `input float theta;`: in the QASM text
2. `qasm3.loads(...)`
3. `Parameter('theta')`: qc.parameters
4. `sampler.run([(qc, [0.5])])`: bound at run time ✓

---

Official exam page: https://www.ibm.com/training/certification/ibm-certified-quantum-computation-using-qiskit-v2x-developer-associate-C9008400  
Qiskit documentation: https://quantum.cloud.ibm.com/docs
