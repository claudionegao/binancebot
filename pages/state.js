import io from 'socket.io-client';
const SOCKET_URL = 'https://binancesocket.onrender.com';


export default function paginastatus() {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.onAny('state', (data) => {
        console.log(data);
    })

    return (<p>State</p>)
}