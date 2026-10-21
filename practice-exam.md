# Qiskit v2.x Developer Associate: 60-Question Practice Exam

Original practice questions written against the published topic outline for IBM exam C1000-179. They are not real exam items. Every code snippet was run on Qiskit 2.5.

Give yourself 90 minutes and pick one answer per question. The answer key with explanations is at the bottom. The interactive version in `web/` is easier to use: it scores you and breaks the results down by section.

> This file is generated from `web/questions.js`. Edit that file, then run `node scripts/build-markdown.js`.


## Section 1: Perform quantum operations

### 1. You're writing the observable for a three-qubit sensor experiment and type `Pauli('XYZ')`. Which qubit does the X act on?

- **A.** Qubit 0
- **B.** Qubit 1
- **C.** Qubit 2
- **D.** All three qubits, one after another

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

### 5. You're estimating what a circuit would cost on future error-corrected hardware, where some gates are cheap and others are very expensive. Which of these is not a Clifford gate?

- **A.** H
- **B.** S
- **C.** CX
- **D.** T

### 6. Logical qubits 0 and 4 need to interact, but they aren't neighbours on the chip, so the router inserts a SWAP. If the native entangling gate is CX, how many CX gates does one SWAP cost?

- **A.** 1
- **B.** 2
- **C.** 3
- **D.** 4

### 7. Which statement is true?

- **A.** `cx(0, 1)` and `cx(1, 0)` are the same operator
- **B.** `cz(0, 1)` and `cz(1, 0)` are the same operator
- **C.** A CZ entangles |00⟩ with no other gates needed
- **D.** A SWAP can be built from a single CZ

### 8. What is the value of `sv.expectation_value(Pauli('X'))`?

```python
sv = Statevector.from_label("-")
```

- **A.** +1
- **B.** 0
- **C.** −1
- **D.** 0.5

### 9. You're modelling a 4-site spin chain with a next-nearest-neighbour coupling between sites 1 and 3. Which dense Pauli label does this produce?

```python
SparsePauliOp.from_sparse_list([("ZZ", [1, 3], 1.0)], num_qubits=4)
```

- **A.** ZIZI
- **B.** IZIZ
- **C.** ZZII
- **D.** IIZZ

### 10. Hardware only measures in the computational (Z) basis. You want to know whether a qubit is in |+⟩ or |−⟩. What do you add just before `measure`?

- **A.** An X gate
- **B.** A Z gate
- **C.** A barrier
- **D.** An H gate


## Section 2: Visualize circuits, measurements, and states

### 11. Which of these is not a valid `output` value for `QuantumCircuit.draw()`?

- **A.** "text"
- **B.** "mpl"
- **C.** "latex_source"
- **D.** "html"

### 12. You prepare a Bell state and call `plot_bloch_multivector(Statevector(bell))`. What do you see?

- **A.** Both arrows point to +Z
- **B.** Both arrows point to +X
- **C.** No visible arrow on either sphere, because each qubit's Bloch vector has length zero
- **D.** One arrow up, one arrow down

### 13. After transpiling for a 127-qubit device, a reviewer asks which physical qubits your 5-qubit circuit landed on, shown on the chip's connectivity graph. Which call gives that picture?

- **A.** `plot_circuit_layout(isa_circuit, backend)`
- **B.** `plot_gate_map(backend)`
- **C.** `plot_histogram(counts)`
- **D.** `plot_state_qsphere(sv)`

### 14. What does `qc.draw('mpl', reverse_bits=True)` change?

- **A.** It permanently reverses the qubit order in `qc`
- **B.** Only the picture: the highest-index qubit is drawn at the top
- **C.** The measurement results come back reversed
- **D.** Gates are drawn right to left

### 15. You've reconstructed a `DensityMatrix` from tomography and want 3D bar charts of the real and imaginary parts of every element, to check whether the off-diagonal coherences survived. Which function?

- **A.** `plot_state_city`
- **B.** `plot_bloch_vector`
- **C.** `plot_distribution`
- **D.** `plot_error_map`

### 16. Before spending QPU time, you want to steer clear of qubits with poor readout and links with bad two-qubit fidelity. Which visualization shows error rates laid out on the device graph?

- **A.** `plot_bloch_multivector`
- **B.** `plot_state_paulivec`
- **C.** `plot_error_map(backend)`
- **D.** `qc.draw('text')`

### 17. You have counts from an ideal simulator and from hardware, and you want them as grouped bars in one chart. What works?

```python
plot_histogram([ideal_counts, hw_counts], legend=["ideal", "hardware"])
```

- **A.** This works: `plot_histogram` takes a list of count dicts and a legend
- **B.** You have to merge the dicts into one first
- **C.** `plot_histogram` only accepts a Statevector
- **D.** Only `plot_state_city` can compare two runs


## Section 3: Create quantum circuits

### 18. What does `qc.measure_all()` do on a 3-qubit circuit with no classical bits?

- **A.** Measures into the default register `c`
- **B.** Adds a barrier, adds a new 3-bit classical register called `meas`, and measures every qubit into it
- **C.** Marks the qubits so they get measured at runtime
- **D.** Measures every qubit and then resets it

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

### 23. A teammate writes `qc.compose(oracle)` and then adds measurements, but the oracle isn't in the drawn circuit. Why?

- **A.** `compose` only works with single gates, not circuits
- **B.** `compose` returns a new circuit. Either reassign (`qc = qc.compose(oracle)`) or pass `inplace=True`
- **C.** `compose` needs a barrier before it
- **D.** The oracle has to be transpiled first

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

### 26. You computed a value into an ancilla, used it, and now need the ancilla back in |0⟩ without disturbing the data qubits it is entangled with. What do you do?

- **A.** `qc.reset(ancilla)`
- **B.** Append the inverse of the block that computed it: `qc.compose(compute.inverse(), inplace=True)`
- **C.** Add a barrier
- **D.** Measure the ancilla and ignore the result

### 27. How many parameters does `real_amplitudes(4, reps=2)` have?

```python
from qiskit.circuit.library import real_amplitudes
ansatz = real_amplitudes(4, reps=2)
```

- **A.** 8
- **B.** 16
- **C.** 6
- **D.** 12

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

### 30. You call `transpile(qc, backend=backend)` without setting `optimization_level`. Which level does Qiskit 2.x use?

- **A.** 0
- **B.** 1
- **C.** 2
- **D.** 3

### 31. You're running VQE: hundreds of short Estimator calls, each depending on the result of the last. Which execution mode fits best?

- **A.** Session
- **B.** Batch
- **C.** Job mode, one job at a time
- **D.** Local simulator only

### 32. You need to run 300 independent characterisation circuits, and none depends on another's result. Which mode makes the most sense?

- **A.** Session
- **B.** A loop that submits one job per circuit
- **C.** Local simulator
- **D.** Batch

### 33. You want to dry-run your whole pipeline with realistic device noise, without spending any QPU time. What works?

```python
from qiskit_ibm_runtime import SamplerV2
from qiskit_ibm_runtime.fake_provider import FakeSherbrooke
```

- **A.** `SamplerV2(mode=FakeSherbrooke())`
- **B.** `QiskitRuntimeService(channel='fake')`
- **C.** `execute(qc, 'fake')`
- **D.** It isn't possible without real hardware

### 34. Which call picks the real device with the shortest queue?

- **A.** `service.backends()[0]`
- **B.** `service.fastest()`
- **C.** `service.least_busy(operational=True, simulator=False)`
- **D.** `AerSimulator()`

### 35. An old tutorial runs circuits with `execute(qc, backend)`. What's the Qiskit 2.x approach?

- **A.** `execute` still works
- **B.** Transpile to ISA, then call `SamplerV2(mode=backend).run([isa])` or the Estimator equivalent
- **C.** `qc.run(backend)`
- **D.** `backend.execute(qc)`

### 36. Your circuit has 3 qubits. After `pm.run(qc)` for a 127-qubit device, `isa.num_qubits` prints 127. What happened?

- **A.** The circuit was widened to the full device. Your 3 virtual qubits are mapped onto 3 physical ones, and the rest sit idle
- **B.** The transpiler hit an error
- **C.** You'll be billed 127× the shots
- **D.** The circuit was copied 42 times

### 37. An H gate is transpiled for a backend whose basis is `{rz, sx, x, cz}`. What comes out?

- **A.** `h`, unchanged
- **B.** `x` followed by `z`
- **C.** A `cz`
- **D.** `rz`, `sx`, `rz`


## Section 5: Use the Sampler primitive

### 38. You built your circuit with `measure_all()` and ran it with `sampler.run([qc])`. How do you get the counts?

- **A.** `result.get_counts()`
- **B.** `result[0].data.meas.get_counts()`
- **C.** `result[0].quasi_dists`
- **D.** `result.data['counts']`

### 39. Your circuit was built as `QuantumCircuit(2, 2)` and measured with `qc.measure([0, 1], [0, 1])`. Calling `result[0].data.meas` raises `AttributeError`. Why?

- **A.** The Sampler drops explicit measurements
- **B.** You need `measure_all()` for the Sampler to work
- **C.** The register is called `c`, so use `result[0].data.c`
- **D.** The shot count was too low

### 40. Which call runs this circuit for exactly 500 shots?

- **A.** `sampler.run([(qc, None, 500)])`
- **B.** `sampler.run([qc, 500])`
- **C.** `sampler.run(qc, 500)`
- **D.** `sampler.run([(500, qc)])`

### 41. You run `StatevectorSampler().run([qc])` without setting shots. How many shots do you get?

- **A.** 1000
- **B.** 1024
- **C.** 4096
- **D.** None. It returns exact probabilities

### 42. You're sweeping a rotation angle for a Rabi-style calibration. The circuit has one parameter and you pass a values array of shape (20, 1) in a single PUB. What is `result[0].data.meas.shape`?

- **A.** (20, 1)
- **B.** (1,)
- **C.** (20,)
- **D.** (1024, 20)

### 43. Which of these lines is not a valid option on Qiskit Runtime's `SamplerV2`?

- **A.** `sampler.options.default_shots = 4000`
- **B.** `sampler.options.dynamical_decoupling.enable = True`
- **C.** `sampler.options.twirling.enable_gates = True`
- **D.** `sampler.options.resilience_level = 1`

### 44. Your circuit measures into two registers, `alice` and `bob`, and you want one combined bitstring per shot. Which call gives you that?

- **A.** `result[0].join_data().get_counts()`
- **B.** `result[0].data.alice + result[0].data.bob`
- **C.** `result.get_counts(all=True)`
- **D.** You can't do this with V2 results


## Section 6: Use the Estimator primitive

### 45. What is the layout of an Estimator PUB?

- **A.** `(circuit, observables, parameter_values, precision)`
- **B.** `(observables, circuit)`
- **C.** `(circuit, shots, observables)`
- **D.** `(circuit, parameter_values, shots)`

### 46. You transpile a 2-qubit ansatz for a 127-qubit backend, then run `estimator.run([(isa, SparsePauliOp('ZZ'))])`. It fails because the observable doesn't match the circuit. What's the right fix?

- **A.** Pad it with identities: `SparsePauliOp('I' * 125 + 'ZZ')`
- **B.** `observable.apply_layout(isa.layout)`
- **C.** Transpile the observable with the pass manager
- **D.** Set `resilience_level = 0`

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

### 48. Observables are passed as an array of shape (3, 1) and parameter values as shape (20, 1) for a one-parameter circuit. What shape is `result[0].data.evs`?

```python
estimator.run([(qc, [["ZZ"], ["XX"], ["ZI"]], values)])  # values.shape == (20, 1)
```

- **A.** (20,)
- **B.** (3,)
- **C.** (3, 20)
- **D.** (60, 1)

### 49. What does `resilience_level = 1`, the Runtime Estimator default, apply?

- **A.** No mitigation at all
- **B.** Readout error mitigation (TREX)
- **C.** Zero-noise extrapolation
- **D.** Full probabilistic error cancellation

### 50. You're computing the energy of a small transverse-field Ising model on the state |00⟩. What does the Estimator return?

```python
H = SparsePauliOp.from_list([("ZZ", 0.5), ("IX", 0.5)])
estimator.run([(QuantumCircuit(2), H)])
```

- **A.** 0.5
- **B.** 1.0
- **C.** 0
- **D.** −0.5

### 51. Your Estimator result has a standard error of about 0.02. Roughly how many more shots do you need to bring it down to 0.01?

- **A.** 2×
- **B.** 10×
- **C.** 100×
- **D.** 4×


## Section 7: Retrieve and analyze results

### 52. You submitted a hardware job yesterday and closed your notebook. You saved the job ID. How do you get the results now?

- **A.** Re-run the circuit
- **B.** `job.restore()`
- **C.** `service.job('<job_id>').result()`
- **D.** `QiskitRuntimeService.load('<job_id>')`

### 53. `job.status()` returns `'QUEUED'`. What does that mean?

- **A.** The job failed
- **B.** It's waiting for its turn on the device and nothing has run yet
- **C.** It's running right now
- **D.** It finished, but the results expired

### 54. A Bell circuit on hardware returns these counts. What fraction of shots landed on the outcomes you'd expect?

```python
{'00': 480, '11': 470, '01': 28, '10': 46}
```

- **A.** ≈ 0.928
- **B.** 0.950
- **C.** ≈ 0.072
- **D.** ≈ 0.469

### 55. Your report needs error bars on each Estimator expectation value. Where do they come from?

- **A.** `result[0].metadata['shots']`
- **B.** `job.status()`
- **C.** `result[0].data.evs ** 2`
- **D.** `result[0].data.stds`

### 56. You want to check whether readout errors drift during a long run, so you need every shot's outcome in order, not totals. Which `BitArray` method gives you that?

- **A.** `get_counts()`
- **B.** `get_bitstrings()`
- **C.** `get_int_counts()`
- **D.** `num_shots`

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


## Section 8: Operate with OpenQASM

### 58. You need to hand a circuit with an `if_test` block to a partner team as plain text. Which export works?

- **A.** `qasm3.dumps(qc)`
- **B.** `qasm2.dumps(qc)`
- **C.** `qc.draw('text')`
- **D.** `str(qc)`

### 59. `qiskit.qasm3.loads(program)` raises `MissingOptionalLibraryError`. What's going on?

- **A.** Qiskit can't import OpenQASM 3 at all
- **B.** You have to use `QuantumCircuit.from_qasm_str` instead
- **C.** The file must end in `.qasm`
- **D.** Importing needs the optional `qiskit-qasm3-import` package

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


---

## Answer key and explanations

**1. C.** Qiskit labels are little-endian, so you read them right to left: Z is on qubit 0, Y on qubit 1 and X on qubit 2. You can check it yourself, since `Pauli('XYZ')[0]` returns `Pauli('Z')`. Textbooks usually write qubit 0 first, so this catches a lot of people.

**2. A.** H swaps the X and Z bases, so a Z sandwiched between two H gates acts as an X. `Operator(qc).equiv(Operator(XGate()))` returns `True`. The same trick works the other way round: on hardware whose native two-qubit gate is CZ, a CX is just a CZ with an H on either side of the target.

**3. D.** RZ(π) is diag(−i, i), which is −i·Z. The two matrices are not equal, so `==` gives `False`. They differ only by a global phase, though, and `equiv` ignores global phase, so it gives `True`. Global phase never shows up in measurement results, which is why the transpiler can swap one gate for the other.

**4. B.** Qubit 0 is always 1, and it is the rightmost character. Qubit 1 is in an equal superposition, so the leftmost character is 0 or 1 with equal odds. That gives '01' and '11'. If you picked {'10': 0.5, '11': 0.5}, you read the string with qubit 0 on the left. (The actual printout shows 0.4999999999999999 because of floating-point rounding.)

**5. D.** Clifford gates map Pauli operators to other Pauli operators, and a circuit made only of them can be simulated efficiently on a classical computer (the Gottesman–Knill theorem). T is the standard non-Clifford gate. In fault-tolerant schemes it needs magic-state distillation, which is why resource estimates usually quote a T-count.

**6. C.** SWAP = CX(0,1) · CX(1,0) · CX(0,1). Transpiling a lone `swap` with `basis_gates=['cx', 'u']` gives exactly `{'cx': 3}`. Two-qubit gates are the noisiest operations on today's devices, so a bad initial layout gets expensive fast.

**7. B.** CZ only puts a −1 phase on |11⟩, so it doesn't matter which qubit you call the control. CX is not symmetric. On |00⟩ a CZ does nothing at all, because you need a superposition first. A SWAP needs three two-qubit gates, not one.

**8. C.** |−⟩ is the −1 eigenstate of X. In practice you'll see something like `-0.9999999999999998` because of floating-point rounding, which you should treat as −1. The Z expectation value of the same state is 0.

**9. A.** `from_sparse_list` puts a Z on qubits 1 and 3. A dense label has qubit 3 on the far left and qubit 0 on the far right, so you get Z I Z I. IZIZ is the same mistake as in the `Pauli('XYZ')` question: reading the label with qubit 0 on the left.

**10. D.** H maps |+⟩ to |0⟩ and |−⟩ to |1⟩, so H followed by a Z measurement is an X-basis measurement. For the Y basis you would add `sdg` and then `h`. The Estimator does this rotation for you behind the scenes whenever you ask for X or Y terms.

**11. D.** The supported outputs are `text`, `mpl`, `latex` and `latex_source`. `mpl` needs matplotlib installed. `latex` needs a working LaTeX install, while `latex_source` just gives you the .tex code to paste into a paper.

**12. C.** `plot_bloch_multivector` draws each qubit's reduced state on its own sphere. In a maximally entangled state, each qubit on its own is maximally mixed, so its vector sits at the centre. The lesson is that Bloch spheres can't show entanglement. Use `plot_state_city` or `plot_state_qsphere` when you need the full state.

**13. A.** `plot_circuit_layout` needs the transpiled circuit, because that's where the layout is stored, plus the backend. It then highlights the qubits you used. `plot_gate_map` draws the chip on its own, without any of your mapping.

**14. B.** Drawing options are cosmetic. People use `reverse_bits=True` to match textbook diagrams that put the most significant qubit on top. If you really want a circuit with reversed qubits, `qc.reverse_bits()` returns a new circuit, and that is a different thing.

**15. A.** `plot_state_city` draws two 3D bar charts, one for the real part and one for the imaginary part. The diagonal holds populations and the off-diagonals hold coherences. Decoherence shows up as the off-diagonal bars shrinking. `plot_state_hinton` shows the same information as 2D squares.

**16. C.** `plot_error_map` colours qubits and couplers by the error rates in the backend's calibration data. Devices are recalibrated regularly, so check it on the day you run, not the week before.

**17. A.** `plot_histogram` takes either one dict or a list of them and draws grouped bars, which makes noise easy to see. If the two runs used different shot counts, `plot_distribution` normalises everything to probabilities, so the comparison is fair.

**18. B.** This is why Sampler results for these circuits sit under `data.meas`. If you only want to measure qubits that actually have gates on them, use `measure_active()`.

**19. D.** `QuantumCircuit(2, 2)` already has two classical bits in a register called `c`. `measure_all()` adds a new `meas` register by default, giving four in total. With SamplerV2 you'd find an all-zero `data.c` next to your real results in `data.meas`. Use `measure_all(add_bits=False)` or an explicit `measure([0, 1], [0, 1])` instead.

**20. C.** `assign_parameters` returns a new circuit by default (`inplace=False`), so the original stays a reusable template. Usually that's what you want. Often you don't need to bind values yourself at all, because the primitives take parameter values directly in the PUB.

**21. C.** `num_parameters` counts the unique unbound parameters that appear in the circuit. θ[1] is never used, and θ[0] counts once even though it appears twice. When you pass values to a primitive, you supply exactly this many, in the order of `qc.parameters`.

**22. A.** The `qubits` list maps the small circuit's qubits, in order, onto the big one: small qubit 0 goes to big qubit 2, and small qubit 1 goes to big qubit 0. So H lands on qubit 2, and the CX becomes `cx(2, 0)`.

**23. B.** Like `assign_parameters`, `compose` leaves the original alone unless you ask otherwise. It's an easy bug to miss because nothing raises an error. The oracle silently goes nowhere.

**24. D.** The three H gates run in parallel, so they take one layer. `cx(0, 1)` is layer two. `cx(1, 2)` has to wait for qubit 1, so it's layer three. Size is simply the total number of operations, which is five.

**25. A.** `c_if` was removed in Qiskit 2.0. Classical control flow now uses context managers: `if_test`, `for_loop`, `while_loop` and `switch`. On IBM hardware these run as dynamic circuits, with mid-circuit measurement and feed-forward, which you need for teleportation and error-correction experiments.

**26. B.** `inverse()` reverses the gate order and takes the adjoint of each gate, so it undoes the computation coherently. Reset and measurement both collapse the ancilla, and because it's entangled with the data qubits they damage those too. That ruins the interference that algorithms like Grover rely on.

**27. D.** There is one layer of RY rotations per repetition plus a final layer, so the count is num_qubits × (reps + 1) = 4 × 3 = 12. Recent Qiskit 2.x releases favour the lowercase function forms such as `real_amplitudes` and `efficient_su2` over the older `RealAmplitudes` and `EfficientSU2` classes.

**28. C.** Without the barrier, the two X gates cancel and the transpiler hands you an empty circuit. The barrier stops optimisation from crossing it, so both gates survive. That's handy in echo and benchmarking experiments, where you want those 'useless' gates kept on purpose.

**29. B.** IBM Runtime only accepts ISA circuits, meaning circuits that use the backend's native gates and respect its connectivity. It won't transpile for you. A preset pass manager is the usual way to produce one.

**30. C.** The default moved from 1 to 2 back in Qiskit 1.3, and `generate_preset_pass_manager` also defaults to 2. Level 3 searches harder and takes longer to compile, which is often worth it for deep circuits that will run many times.

**31. A.** A session keeps the QPU available to you between iterations, so you don't rejoin the queue for every optimiser step. Sessions aren't available on the free Open plan, so if that's your plan you'll be using job or batch mode.

**32. D.** Batch is meant for independent jobs. The scheduler can overlap their classical pre- and post-processing, and you don't hold the device idle between them as you would in a session.

**33. A.** If you pass a fake backend as the `mode`, the primitives run in local testing mode on Aer, using a noise model taken from a snapshot of that device. You need `qiskit-aer` installed. The snapshot is old, so don't expect the numbers to match today's device.

**34. C.** `least_busy` sorts by pending jobs. The shortest queue isn't always the best choice, though. A device with better error rates on the qubits you need can be worth the wait.

**35. B.** `execute` was removed in Qiskit 1.0, and the V1 `Sampler` and `Estimator` reference classes were removed in 2.0. For exact local results, use `StatevectorSampler` and `StatevectorEstimator`. For hardware, use the Runtime V2 primitives.

**36. A.** ISA circuits are defined on the device's physical qubits. Which physical qubits you got is stored in `isa.layout`. This matters as soon as you use the Estimator, because your observables have to be widened the same way.

**37. D.** H = RZ(π/2) · SX · RZ(π/2), up to a global phase. On IBM hardware RZ is a virtual frame change and costs essentially nothing, so the real cost of a single-qubit gate is roughly its number of SX and X pulses.

**38. B.** With V2 primitives you go step by step: the `PrimitiveResult`, then `[0]` for the first PUB, then `.data`, then the classical register name, which gives you a `BitArray`. `quasi_dists` belonged to the old V1 Sampler.

**39. C.** When you create a circuit as `QuantumCircuit(n, m)`, the classical register is named `c`. If you're not sure, `list(result[0].data.keys())` tells you exactly which registers came back.

**40. A.** A Sampler PUB is `(circuit, parameter_values, shots)`. You can also write `sampler.run([qc], shots=500)`, which applies to every PUB that doesn't set its own. A per-PUB value wins. `[qc, 500]` would make 500 a second PUB, which fails.

**41. B.** `default_shots` is 1024. Even though it's built on an exact statevector, it still samples, so the counts wobble from run to run. Pass `seed=` if you need reproducible numbers in a test, or use `Statevector.probabilities_dict()` for the exact values.

**42. C.** The last axis of the parameter array holds the circuit's parameters, which is one here. Whatever is left, (20,), is the shape of the PUB, so you get one `BitArray` slice per angle. `get_counts(loc=7)` gives the counts for the eighth angle. That's one PUB instead of twenty separate jobs.

**43. D.** `resilience_level` is an Estimator option. The Sampler supports error suppression such as dynamical decoupling and Pauli twirling, but not the readout mitigation and ZNE levels you get with the Estimator.

**44. A.** `join_data()` concatenates the registers into a single `BitArray`. The register added later sits on the left, the same little-endian convention as qubits. With `alice = 0` and `bob = 1`, you get `'10'`.

**45. A.** Only the circuit and the observables are required. `(circuit, parameter_values, shots)` is a Sampler PUB, which is an easy one to mix up. Results come back as `result[0].data.evs` for the values and `result[0].data.stds` for their standard errors.

**46. B.** Padding with identities makes the sizes match, but it puts ZZ on physical qubits 0 and 1, and the router may well have placed your qubits somewhere else. `apply_layout` handles both the widening and the permutation.

**47. D.** The two qubits are perfectly correlated in both the Z and X bases, but each qubit on its own is completely random. Measuring ZZ and XX together is a cheap way to check entanglement on real hardware: if both come back close to 1, your Bell pair is in good shape.

**48. C.** The parameter array has a broadcast shape of (20,), and NumPy broadcasting of (3, 1) with (20,) gives (3, 20). So you get every observable at every angle, 60 numbers from one PUB.

**49. B.** Level 0 applies nothing. Level 1 adds TREX for readout errors. Level 2 adds zero-noise extrapolation and gate twirling on top. Each step up costs more runtime and usually increases the variance, so only go higher when the bias is actually hurting you.

**50. A.** Expectation values are linear, so the energy is 0.5·⟨ZZ⟩ + 0.5·⟨IX⟩ = 0.5·1 + 0.5·0. Remember that `IX` puts the X on qubit 0. This number is exactly what a VQE loop tries to minimise.

**51. D.** Shot noise falls as 1/√N, so halving the error takes four times the shots. On hardware, mitigation adds its own sampling overhead on top of that, so budget accordingly.

**52. C.** This is why you should always print or log `job.job_id()` when you submit. IBM keeps results for a while, but without the ID you'll be digging through the dashboard to find them.

**53. B.** After QUEUED you'll typically see RUNNING and then DONE, or ERROR or CANCELLED if something went wrong. `job.result()` blocks until the job finishes, so you don't need a polling loop if you're happy to wait.

**54. A.** The total is 1024 shots, not 1000, so it's (480 + 470) / 1024 ≈ 0.928. 0.950 is what you get if you assume 1000 shots. Keep in mind that this is only a Z-basis check. A mixed state of 00 and 11 would score just as well, so to confirm real entanglement you also need the XX correlation.

**55. D.** `stds` has the same shape as `evs` and gives the standard error of each value. If you report an expectation value without one, a reviewer will rightly ask for it.

**56. B.** Counts add everything up and throw away the order. `get_bitstrings()` returns one string per shot, so you can slice it into windows and compare them.

**57. C.** Qubit 0 is the rightmost character in the bitstring. If you post-process counts by indexing into the string, remember that `bitstring[-1]` is qubit 0, not `bitstring[0]`.

**58. A.** OpenQASM 2 only has the old register-equality `if`, so `qasm2.dumps` raises `QASM2ExportError` on this circuit. OpenQASM 3 handles it fine, and the output contains `if (c[0]) { x q[1]; }`.

**59. D.** Exporting to OpenQASM 3 is built in, but importing it needs `pip install qiskit-qasm3-import`. `QuantumCircuit.from_qasm_str` only reads OpenQASM 2, so it won't help with a 3.0 program.

**60. B.** `input` declarations are how OpenQASM 3 expresses values supplied at runtime, and they come into Qiskit as ordinary circuit parameters. That means a parameterised circuit can make the round trip through QASM without losing its parameters.


---

Official exam page: https://www.ibm.com/training/certification/ibm-certified-quantum-computation-using-qiskit-v2x-developer-associate-C9008400  
Qiskit documentation: https://quantum.cloud.ibm.com/docs
