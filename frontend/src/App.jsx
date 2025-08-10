import React, { useState } from 'react';

const ExampleComponent = () => {
    const [message, setMessage] = useState('');

    const handleCreatePlaylist = async () => {
        try {
            const response = await fetch('http://localhost:8080/home');
            const text = await response.text();
            setMessage(text);
        } catch (error) {
            setMessage('Error connecting to backend');
        }
    };

    return (
        <div>
            <h1>Hello from ExampleComponent!</h1>
            <p>This is a simple example component.</p>
            <button onClick={handleCreatePlaylist}>Create Spotify Playlist</button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ExampleComponent