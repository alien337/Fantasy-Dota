# Project Overview

This project is a Dota 2 fantasy statistics analyzer. It is a web-based application that fetches data from the OpenDota API to analyze the performance of professional Dota 2 players. The application calculates fantasy scores based on a set of rules and provides a summary of player statistics.

The main components of the project are:

*   **`index.html`**: The main HTML file for the web interface.
*   **`players_config.json`**: A configuration file that lists the players to be analyzed.
*   **`matches/`**: A directory where match data is cached in JSON format.
*   **`players/`**: A directory where individual player statistics are stored in JSON format.

# Running the Application

This is a web-based project and can be run by opening the `index.html` file in a web browser.

# Development Conventions

*   **Data Storage**: Player and match data are stored in JSON format in the `players/` and `matches/` directories, respectively.
*   **API Integration**: The application interacts with the OpenDota API to retrieve game data.
*   **Configuration**: The `players_config.json` file is used to manage the list of players for analysis.
*   **Scoring**: The fantasy scoring rules are defined in the `index.html` file.
