crow-bandit-brain
=================

### Inspiration

> We show that single-neuron responses in the pallial endbrain of crows performing a visual detection task correlate with the birds’ perception about stimulus presence or absence and argue that this is an empirical marker of avian consciousness.

-- [Nieder, Wagener & Rinnert - A neural correlate of sensory consciousness in a corvid bird](https://science.sciencemag.org/content/369/6511/1626)

### Purpose

"surely we can cobble together a demo where a small piece of dumb software can perform a similar visual detection task and thus demonstrates a comparable empirical marker of consciousness"

## Progress

### Bandit status

"Bandit" refers to the classic reinforcement learning problem of the [Multi-armed bandit](https://en.wikipedia.org/wiki/Multi-armed_bandit).  The goal is to model the crow's visual detection task as an instance of the [contextual multi-armed bandit problem](https://en.wikipedia.org/wiki/Multi-armed_bandit#Contextual_bandit).

*   Phase 1 model - completed.
*   Phase 2 model - completed.

There are [interactive demos](https://fcostin.github.io/crow-bandit-brain/) of both models that can be run in a web browser.

#### Phase 1 model

There is no model of perception. Instead, input stimuli are modelled in a simplistic way: the space of input stimuli is modelled as a set containing 4 distinct elements, one for each case that can be perceived. There is no uncertainly in what element is observed. The model starts with no knowledge about the mapping from stimuli and actions to rewards, and needs to learn this by selecting and performing an action in response to each input element.

#### Phase 2 model

This phase adds a basic model of perception that more accurately models the experimental procedure:

*   model the stimuli scenario chosen by the experimenters as distinct from what is perceived by the crow
*   model 6 different classes of the first stimuli: no-light, light-very-weak, light-weak, light-moderate, light-high, light-very-high
*   define a mapping from the discrete stimuli classes to a continuous variable that represents what the crow perceives
*   add a noise model that makes it very difficult to distinguish between perceived values corresponding to the "no-light" and "light-very-weak" classes
*   implement a contextual bandit learning algorithm that is able to consume a low-dimentional continuous input feature in R^2 with enough capacity to learn a XOR function relationship when selecting actions


### Brain status

The demo is not very brain-like. Input sensory data, learned information & output action triggers are stored in an idiomatic software way -- as values in data structures. Internal state is evolved idiomatically as computation by a software application. There is no attempt to simulate or approximate how an actual brain might work.

### Crow status

The demo is not at all crow-like.

### Future work

Potential future extension: represent the entire internal state of the "brain" and the evolution of state over time in response to stimuli in a more analog way, where more of the state and evolution is simulated rather than directly computed. Define the state as a system of ordinary differential equations. Define rules to evolve the system of equations over time in a way that can implement the same perception and learning capability. Plot lots of graphs showing the system state evolving over time. Inject noise into parts of the system and see if performance degrades in entertaining ways.


### References

*   [Li, Chu, Langford & Schapire - Contextual-Bandit Approach to Personalized News Article Recommendation](http://rob.schapire.net/papers/www10.pdf)

*   [Nieder, Wagener & Rinnert - A neural correlate of sensory consciousness in a corvid bird](https://science.sciencemag.org/content/369/6511/1626)

