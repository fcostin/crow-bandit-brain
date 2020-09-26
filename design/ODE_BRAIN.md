For a more convincing demo, we'd
*   make everything less discrete
*   simulate the memory storage & memory updates

One way to do this could be to model the basic bandit as a system of ODEs

Primitives we need:

*   read activation of a feature input

*   write activation of action output

*   memory of
        how many times we've seen things
        what's the mean reward

*   computing the ucb values

*   read reward input

*   update memory based on reward


~~~
Level 0 --- direct encoding of model as simple code
Level 10 --- encoding of model & update algo as time dependent system of ODEs etc
~~~


Gate(c, x) := { 0 if c < 0.5
              { x if c >= 0.5
              
Gate(c, x) := x * Sign(c - 0.5)




### sharpen


action potentials  {p_j} P_1, ... P_J

normalise so sigma_j p_j = 1 ; p_j >= 0


iterate (only need to do this 3--5 times, say)
    p <- p^2
    p <- p / sum(p)
    
could express iteration with layers

do an action randomly using sharpened weights ps

###

How to update weights?
