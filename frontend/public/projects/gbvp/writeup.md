

GoodBoy VP was my final project for [CMPM 146 - Game AI](https://courses.engineering.ucsc.edu/courses/cmpm146) at the University of California, Santa Cruz with professor [Daniel Shapiro](https://campusdirectory.ucsc.edu/cd_detail?uid=dgs).

Inspired by games like Nintendogs, GoodBoy VP is a virtual pet game where the player is put in charge of taking care of a pet dog and making sure that it stays healthy through actions such as feeding or walking it. Unlike those games however, GoodBoy VP uses a hybrid AI system for the dog powered by a Hierarchical Finite State Machine fed information by a Large Language Model. The LLM handles taking user input and scenario generation while the HFSM ensures that it doesn't go too far off of the rails by ensuring new states and values follow transitions that makes sense for a dog.


- **[GitHub Repository](https://github.com/collectioncard/Good-Boy-VP)**: Check out the source code
- **[Play on itch.io](https://collectioncard.itch.io/good-boy-virtual-pet)**: Download the game and try it out!

### My Contributions:
My role in this project was to handle integrating the LLM with the HFSM. To achieve this, I wrote an interface that allowed our Unity game to communicate with the OpenAI API. We used the, new at the time, structured output format to ensure that we received both a story to present to the user as well as state changes that the HFSM would either accept or reject.

### Challenges and Solutions:
We faced a number of challenges in this project, but the largest was prompt engineering. We purposely chose not to supply the LLM with any conversation history context, but still wanted it to reference the current state of the dog. In the end, we decided to embed the information currently in the HFSM in every call to the language model. This allowed the user to take the conversation anywhere they wanted at any time while still ensuring that the dog took in details such as its health and tiredness. Our final prompt is as follows:

> You are a virtual pet dog. The next message will contain the status of the dog, the current overall dog state, and a list of all states that it is possible to transition to within an HFSM (Hierarchical Finite State Machine). The message following that will contain the user input, which is how the user wants to interact with the dog. Your job is to: 1. Provide a short description of how the dog reacts to the user input. This MUST directly reflect the specific user action. For example, if the user message is 'give the dog food', your description could be 'The dog eagerly eats the food, wagging its tail in excitement'. 2. Update the dog's status values based on the interaction. For instance, feeding the dog would decrease its hunger level. 3. Select the appropriate next state for the dog based on the interaction and the list of valid state transitions.

### Project Takeaways:
This project was my first time working directly with a large language model and its API system and I learned a lot from it. Some key skills that I learned and have applied in other projects are:
- LLM prompt engineering
- REST APIs
- HFSM development
- Game development in Unity