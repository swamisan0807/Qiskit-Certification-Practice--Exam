# Five-Day Study Plan

Spend about two hours a day, and keep a Qiskit 2.x notebook open the whole time. Running the code is what makes it stick.

### Day 1: Gates, states and bit ordering
- X, Y, Z, H, S, T and the controlled gates. Know which ones are Clifford.
- Use `Statevector`, `Operator` and `Pauli`. Try `==` against `.equiv()` on gates that differ only by a global phase.
- Practise reading bitstrings and Pauli labels right to left until it's automatic.
- Practice-mode questions: section 1.

### Day 2: Building circuits and drawing them
- `measure_all` vs `measure`, `compose` with `qubits=`, `assign_parameters`, `ParameterVector`.
- `if_test` and the other control-flow context managers.
- `draw('mpl')`, `plot_histogram`, `plot_bloch_multivector`, `plot_state_city`, `plot_circuit_layout`.
- Sections 2 and 3.

### Day 3: Getting circuits onto hardware
- `generate_preset_pass_manager`, and what changes between optimization levels 0 and 3.
- ISA circuits and layouts. Why a 3-qubit circuit comes back 127 qubits wide.
- Job, Session and Batch modes. Local testing with a fake backend.
- Section 4.

### Day 4: Primitives
- Sampler PUBs, `BitArray`, register names and `join_data()`.
- Estimator PUBs, `apply_layout`, broadcasting shapes, `evs` and `stds`, resilience levels.
- Sections 5, 6 and 7.

### Day 5: OpenQASM and a full mock
- `qasm2.dumps` vs `qasm3.dumps`, and what `qasm3.loads` needs installed.
- Take the full **timed exam** in the web app without notes.
- For every miss, write one sentence in your own words saying why the right answer is right.

## Before you book

- [ ] I can predict a bitstring from a circuit without running it.
- [ ] I know where the counts live in a SamplerV2 result for both `measure_all()` and `QuantumCircuit(n, m)`.
- [ ] I can write a Sampler PUB and an Estimator PUB from memory.
- [ ] I know why `apply_layout` is needed and what goes wrong without it.
- [ ] I can pick between Session and Batch for a given workload.
- [ ] I've scored 70% or more on the timed exam at least twice.
- [ ] I've reread the [official exam objectives](https://www.ibm.com/training/certification/ibm-certified-quantum-computation-using-qiskit-v2x-developer-associate-C9008400) in case they've changed.
