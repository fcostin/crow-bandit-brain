#!/urs/bin/env python3

from math import log
import random

INPUT_STIMULUS_RED = "stimulus-red"
INPUT_STIMULUS_BLUE = "stimulus-blue"
INPUT_NO_STIMULUS_RED = "no-stimulus-red"
INPUT_NO_STIMULUS_BLUE = "no-stimulus-blue"

I = [
    INPUT_STIMULUS_RED,
    INPUT_STIMULUS_BLUE,
    INPUT_NO_STIMULUS_RED,
    INPUT_NO_STIMULUS_BLUE,
]

ACTION_YES = "yes"
ACTION_NO = "no"

A = [
    ACTION_YES,
    ACTION_NO,
]

INPUT_ACTION_REWARD = {
    (INPUT_STIMULUS_RED, ACTION_YES): 1.0,
    (INPUT_STIMULUS_RED, ACTION_NO): 0.0,
    (INPUT_STIMULUS_BLUE, ACTION_YES): 0.0,
    (INPUT_STIMULUS_BLUE, ACTION_NO): 1.0,
    (INPUT_NO_STIMULUS_RED, ACTION_YES): 0.0,
    (INPUT_NO_STIMULUS_RED, ACTION_NO): 1.0,
    (INPUT_NO_STIMULUS_BLUE, ACTION_YES): 1.0,
    (INPUT_NO_STIMULUS_BLUE, ACTION_NO): 0.0,
}

BIGV = 1.0e1  # a finite but very enticing value

C = 1.0  # explore-exploit tradeoff constant

# initialise memory

n = {i: 0.0 for i in I}  # how many times we've seen input i
z = {(i, a): 0.0 for i in I for a in A}  # how many times we've done a in response to i
v = {
    (i, a): 0.5 for i in I for a in A
}  # our prior of the value of doing a in repsonse to i


def where(p, a, b):
    return a if p else b


def uncertainty(n_, z_):
    if z_ == 0:
        return BIGV
    else:
        return (log(n_) / z_) ** 0.5


def argmax(action_weights):
    max_w = max({action_weights[a] for a in A})
    maxima = {a for a in A if action_weights[a] == max_w}
    a_star = random.choice(list(maxima))
    return a_star


def act(i_prime, a_star):
    reward = INPUT_ACTION_REWARD[(i_prime, a_star)]
    return reward


while True:
    # The environment generates an input i' for us to observe.
    i_prime = random.choice(I)

    # observe the input i' with our sensors
    s = {i: (i == i_prime) for i in I}

    # decide which action a* to do
    ucb = {(i, a): v[(i, a)] + C * uncertainty(n[i], z[(i, a)]) for i in I for a in A}
    p = {a: sum({ucb[(i, a)] * s[i] for i in I}) for a in A}
    a_star = argmax(p)

    # respond to i' by doing a* and see what reward r the environment gives us
    r = act(i_prime, a_star)

    # remember how many times we've observed i' and done a* in response to i'
    succ_n = {i: n[i] + int(i == i_prime) for i in I}
    succ_z = {
        (i, a): z[(i, a)] + int(i == i_prime and a == a_star) for i in I for a in A
    }

    # update our belief of how valuable doing a* in response to i' is.
    succ_v = {
        (i, a): where(
            i == i_prime and a == a_star,
            (v[(i, a)] * z[(i, a)] + r) / (z[(i, a)] + 1.0),
            v[(i, a)],
        )
        for i in I
        for a in A
    }

    n = succ_n
    z = succ_z
    v = succ_v

    # show stats
    print("act i'=%r a*=%r : r=%r" % (i_prime, a_star, r))
    print()
    print("%50s\t%4s\t%4s" % ("input-action pair", "V", "UCB"))
    for k in sorted(ucb):
        print("%50s\t%4g\t%.4g" % (k, v[k], ucb[k]))
    print()
    input()
