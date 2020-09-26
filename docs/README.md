### CROW-BANDIT-BRAIN


feature detector inputs x   {x_i, } x_1, ..., x_I

action space {a_j, } a_1, ..., a_J

bandit-algo

Z_i    how many times have i seen situation (x_i, )?
    
Z_ij   how many times have i tried (x_i, a_j, )? 
    
V_ij   what's the mean reward for (x_i, a_j, )?
    
    
UCB_ij    what's the ucb for (x_i, a_j, )?

UCB_ij = V_ij + C * sqrt{ ln( Z_i ) / Zij }

For some constant param C > 0

j* = argmax_j UCB_ij

activate output for action a_j*


update Z_i
update Z_ij*
update V_ij* 


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

how to encode
--  count
--  mean value of reward
???


advance from n to n + b

two storage cells

    value(dst_cell) := value(src_cell) + Gate(control, value(b_cell))
    
INCREMENT(control, src_cell, b_cell, dst_cell)

COPY(control, src_cell, dst_cell)


oh god i need some kind of beat for an instruction counter

and i need to encode the instructions somehow.


there's a large number of control lines

each one plays to its own beat

i can rig periodic oscilators / spike functions for each beat

lol


~~~~~~~~~



over time, evolve y(t) ---> K


error(K, (y(t)) = K - y(t)

y'(t) = gamma * error(K, (y(t))

gamma > 0 is some rate coeff, say


over time, hold y(t) constant

~~~~~~~~~~

controllable evolution


y'(t) = Gate( control(t), gamma * error(a, (y(t)) )

where control(t) = beat_{123}(t) 
and where a is some constant target we seek during beat 123

rest
up
act 1
down
rest
up
act 2
down
rest
up
act 3
down


beat K is 0 during all acts k where k != K
beat K is 0 during all rests
beat K is 1 during act K
beat K is smooth


######

beats



