
Let inputs = {
    stimulus-red,
    stimulus-blue,
    no-stimulus-red,
    no-stimulus-blue,
} indexed by i

Let actions = {
    yes,
    no,
} indexed by a

let rewards_{i,a} be defined by
    stimulus-red        yes     1
    stimulus-red        no      0
    stimulus-blue       yes     0
    stimulus-blue       no      1
    no-stimulus-red     yes     0
    no-stimulus-red     no      1
    no-stimulus-blue    yes     1
    no-stimulus-blue    no      0


~~~~~~

### bandit definition

### (define state vector)

name    shape   initial value   description

Let s_{i} := 0 sensor inputs   # bound to environment
Let Z_{i} := 0   counts how many times we have seen i
Let z_{i,a} := 0  counts how many times we did a after seeing i
Let v_{i,a} := 0.5   counts our estimated value of doing a after seeing i
Let ucb_{i,a} := 0   counts our estimated upper confidence bound on the value of doing a after seeing i
Let p_{a} := 0 action preference    expresses our preference for doing action a
Let do_{a} := 0 action outputs      # bound to environment
Let r := 0 reward sensor            # bound to environment


### - SENSE

i' : the input stimuli

s_{i} = (i == i')

### - DECIDE

ucb_{i,a} = v_{i,a} + C * where(z_{i,a}>0, sqrt{ ln( Z_{i} ) / z_{i,a}, inf) }

p_{a} = sum_{i} ucb_{i,a} * s_{i} # aka dot product

do_{a} = where(p_{a} = max_{a}(p_{a}), 1, 0)

### - ACT

emit action a* ~ argmax_{a} do_{a}

### - REWARD

r = get reward

### - UPDATE

succ Z_{i'} = Z_{i'} + 1
succ z_{i',a*} = z_{i',a*} + 1
succ v_{i',a*} = (v_{i',a*} * z_{i',a*} + r) / ( z_{i',a*} + 1)



