const express = require('express');
const { solveTango } = require('./tangoSolver');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('all ok!');
});

app.post('/solve', (req, res) => {
    const { filled_cells, equal_constraints, cross_constraints } = req.body;
    const result = solveTango({
        filled_cells,
        equal_constraints,
        cross_constraints,
    });

    if (result.status === 'Solved') {
        return res.status(200).json(result);
    }

    return res.status(422).json(result);
});

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running,and App is listening on port "+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    }
);