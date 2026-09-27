const liveSessions = new Map();

const getLiveSession = (roomId) => liveSessions.get(roomId);
const setLiveSession = (roomId, payload) => liveSessions.set(roomId, payload);
const deleteLiveSession = (roomId) => liveSessions.delete(roomId);
const listLiveSessions = () => Array.from(liveSessions.values());

module.exports = { getLiveSession, setLiveSession, deleteLiveSession, listLiveSessions };
