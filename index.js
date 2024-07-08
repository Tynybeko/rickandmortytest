"use strict";
const fs = require("fs");
const pg = require("pg");
const fetch = require("node-fetch");

const config = {
    connectionString: "postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1",
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("/home/runner/.postgresql/root.crt").toString(),
    },
};

const client = new pg.Client(config);

const fetchData = async (url) => {
    const response = await fetch(url);
    const data = await response.json();
    return data;
};

const insertData = async (data) => {
    for (const character of data.results) {
        const query = `
            INSERT INTO <table-name> (id, name, status, species, type, gender, origin, location, image, episode, url, created)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO NOTHING;
        `;
        const values = [
            character.id, character.name, character.status, character.species,
            character.type, character.gender, character.origin.name,
            character.location.name, character.image, character.episode.join(','),
            character.url, character.created
        ];
        await client.query(query, values);
    }
};

const main = async () => {
    try {
        await client.connect();
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS <table-name> (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                status VARCHAR(20),
                species VARCHAR(50),
                type VARCHAR(50),
                gender VARCHAR(20),
                origin VARCHAR(100),
                location VARCHAR(100),
                image VARCHAR(255),
                episode TEXT,
                url VARCHAR(255),
                created TIMESTAMP
            );
        `;
        await client.query(createTableQuery);

        let url = "https://rickandmortyapi.com/api/character";
        while (url) {
            const data = await fetchData(url);
            await insertData(data);
            url = data.info.next;
        }
    } catch (err) {
        console.error("Error: ", err);
    } finally {
        await client.end();
    }
};

main();
