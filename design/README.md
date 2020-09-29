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



