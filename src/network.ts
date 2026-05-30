/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Peer, DataConnection } from 'peerjs';
import { NetworkMessage, GameState, Player, NetworkMessageType } from './types';

export class SpeedBingoNetwork {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map(); // For host: clientId -> connection
  private hostConnection: DataConnection | null = null; // For client: connection to host

  public peerId: string | null = null;
  public roomId: string | null = null;
  public isHost: boolean = false;

  // Callbacks
  public onConnectionOpen: (id: string) => void = () => {};
  public onConnectionClosed: (reason?: string) => void = () => {};
  public onError: (error: string) => void = () => {};
  public onMessage: (fromId: string, message: NetworkMessage) => void = () => {};
  public onPlayerDisconnected: (playerId: string) => void = () => {};

  constructor() {}

  /**
   * Generates a unique 6-character room ID (e.g., SB83F2)
   */
  public static generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Readable alphanumeric
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SB${code}`;
  }

  /**
   * Initialize PeerJS as Host
   */
  public initHost(roomId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.roomId = roomId;
      this.connections.clear();
      this.hostConnection = null;

      // Create Peer with specified Room ID & STUN Servers config
      this.peer = new Peer(roomId, {
        debug: 1, // Only errors/warnings to avoid cluttering console
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
          ],
          iceTransportPolicy: 'all',
        },
      });

      this.peer.on('open', (id) => {
        this.peerId = id;
        this.onConnectionOpen(id);
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        // A client connects to host
        this.handleIncomingConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Host PeerJS Error:', err.type, err.message);
        let errorMsg = '네트워크 연결 오류가 발생했습니다.';
        if (err.type === 'unavailable-id') {
          errorMsg = '이미 사용 중인 방 번호입니다. 다른 번호로 방을 생성해주세요.';
        } else if (err.type === 'peer-unavailable') {
          errorMsg = '호스트를 찾을 수 없습니다. 방 코드를 다시 확인해주세요.';
        }
        this.onError(errorMsg);
        reject(new Error(errorMsg));
      });

      this.peer.on('close', () => {
        this.onConnectionClosed('Host connection closed');
      });

      this.peer.on('disconnected', () => {
        // Try to reconnect if signaling server disconnected
        this.peer?.reconnect();
      });
    });
  }

  /**
   * Initialize PeerJS as Client and connect to Host
   */
  public initClient(roomId: string, playerName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomId = roomId;
      this.connections.clear();

      // Create Peer with random ID & STUN Configuration
      this.peer = new Peer({
        debug: 1,
        host: '0.peerjs.com',
        port: 443,
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
          ],
          iceTransportPolicy: 'all',
        },
      });

      let hasResolved = false;

      // 15 seconds connection timeout fallback for P2P NAT issues
      const connectionTimeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          this.destroy();
          reject(new Error('연결 시간 초과: 방이 존재하지 않거나 네트워크 방화벽 또는 다른 망 환경때문에 연결할 수 없습니다.'));
        }
      }, 15000);

      this.peer.on('open', (myId) => {
        this.peerId = myId;

        // Attempt connection to host (room ID represents host Peer ID)
        const conn = this.peer!.connect(roomId, {
          reliable: true,
        });

        this.handleHostConnection(
          conn, 
          playerName, 
          (id) => {
            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(connectionTimeout);
              resolve(id);
            }
          }, 
          (err) => {
            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(connectionTimeout);
              reject(err);
            }
          }
        );
      });

      this.peer.on('error', (err) => {
        console.error('Client PeerJS Error:', err.type, err.message);
        let errorMsg = '네트워크 오류가 발생했습니다.';
        if (err.type === 'peer-unavailable') {
          errorMsg = '방을 찾을 수 없습니다. 코드를 확인 후 다시 입력해주세요.';
        }
        this.onError(errorMsg);
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(connectionTimeout);
          reject(new Error(errorMsg));
        }
      });

      this.peer.on('close', () => {
        this.onConnectionClosed('Client peer closed');
      });

      this.peer.on('disconnected', () => {
        this.peer?.reconnect();
      });
    });
  }

  /**
   * Handle incoming connection from client (Host perspective)
   */
  private handleIncomingConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data: any) => {
      try {
        const msg = data as NetworkMessage;
        this.onMessage(conn.peer, msg);
      } catch (e) {
        console.error('Failed to parse client message:', e);
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.onPlayerDisconnected(conn.peer);
    });

    conn.on('error', (err) => {
      console.error('Connection error for peer:', conn.peer, err);
      this.connections.delete(conn.peer);
      this.onPlayerDisconnected(conn.peer);
    });
  }

  /**
   * Handle outgoing connection to host (Client perspective)
   */
  private handleHostConnection(
    conn: DataConnection,
    playerName: string,
    resolve: (id: string) => void,
    reject: (reason: any) => void
  ) {
    this.hostConnection = conn;

    conn.on('open', () => {
      // Successfully connected to host
      this.onConnectionOpen(this.peerId || '');

      // Send join event with name
      this.sendToHost('client:join', { name: playerName });

      resolve(this.peerId || '');
    });

    conn.on('data', (data: any) => {
      try {
        const msg = data as NetworkMessage;
        this.onMessage(conn.peer, msg);
      } catch (e) {
        console.error('Failed to parse host message:', e);
      }
    });

    conn.on('close', () => {
      console.warn('Disconnected from host.');
      this.hostConnection = null;
      this.onConnectionClosed('호스트와의 연결이 끊어졌습니다.');
    });

    conn.on('error', (err) => {
      console.error('Host connection error:', err);
      this.hostConnection = null;
      this.onConnectionClosed('호스트 연결에 오류가 발생했습니다.');
      reject(err);
    });
  }

  /**
   * Send message to host (executed by Client)
   */
  public sendToHost(type: NetworkMessageType, payload: any) {
    if (this.isHost || !this.hostConnection) return;
    const message: NetworkMessage = { type, payload };
    this.hostConnection.send(message);
  }

  /**
   * Send message to a specific client (executed by Host)
   */
  public sendToClient(clientId: string, type: NetworkMessageType, payload: any) {
    if (!this.isHost) return;
    const conn = this.connections.get(clientId);
    if (conn && conn.open) {
      const message: NetworkMessage = { type, payload };
      conn.send(message);
    }
  }

  /**
   * Broadcast message to all connected clients (executed by Host)
   */
  public broadcast(type: NetworkMessageType, payload: any) {
    if (!this.isHost) return;
    const message: NetworkMessage = { type, payload };
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  /**
   * Disconnect and clean up
   */
  public destroy() {
    if (this.isHost) {
      // Notify clients host is leaving
      this.broadcast('client:leave', null);
    } else if (this.hostConnection) {
      this.sendToHost('client:leave', null);
    }

    this.connections.forEach((conn) => conn.close());
    this.connections.clear();

    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.peerId = null;
    this.roomId = null;
    this.isHost = false;
  }
}
