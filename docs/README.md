# ASEOS Project Documentation

Welcome to the documentation for the ASEOS Project Health Monitoring Tool.

## Project Structure

The project is organized into the following main directories:

- `/frontend`: Contains the user interface code, likely built with a modern JavaScript framework.

- `/backend`: Houses the server-side application. It provides a RESTful API for the frontend to interact with the database.

- `/database`: This directory contains all database-related files.
  - `schema.sql`: The SQL script to create the database schema (tables, relationships, etc.).
  - `data.sql`: Sample data to populate the database for development and testing.

- `/ai-services`: Includes Python scripts for machine learning models, such as predicting project risk.

- `/docs`: Project documentation, including this file.

## Getting Started

1.  **Database**: Set up your MySQL database using `database/schema.sql` and populate it with `database/data.sql`.
2.  **Backend**: Navigate to the `/backend` directory, run `npm install` to install dependencies, and then `npm start` to run the server.
3.  **Frontend**: See the `README.md` in the `/frontend` directory for instructions on how to start the UI.