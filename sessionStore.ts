abstract class SessionStore {
  // abstract findSession(id: string): string | undefined;
  abstract findSession(id: string): Record<string, unknown> | undefined;
  abstract saveSession(id: string, session: Record<string, unknown>): void;
  abstract findAllSessions(): Record<string, unknown>[];
}

class InMemorySessionStore extends SessionStore {
  private static instance: InMemorySessionStore;
  private sessions: Map<string, Record<string, unknown>>;

  private constructor() {
    super();
    this.sessions = new Map();
  }

  static getInstance(): InMemorySessionStore {
    if (!InMemorySessionStore.instance) {
      InMemorySessionStore.instance = new InMemorySessionStore();
    }
    return InMemorySessionStore.instance;
  }

  findSession(id: string): Record<string, unknown> | undefined {
    return this.sessions.get(id);
  }

  saveSession(id: string, session: Record<string, unknown>): void {
    this.sessions.set(id, session);
  }

  findAllSessions(): Record<string, unknown>[] {
    return [...this.sessions.values()];
  }
}

export default InMemorySessionStore;

//   class InMemorySessionStore extends SessionStore {
//     private sessions: Map<string, Record<string, unknown>>;

//     constructor() {
//       super();
//       this.sessions = new Map();
//     }

//     findSession(id: string): Record<string, unknown> | undefined {
//         return this.sessions.get(id);
//       }

//     saveSession(id: string, session: Record<string, unknown>): void {
//       this.sessions.set(id, session);
//     }

//     findAllSessions(): Record<string, unknown>[] {
//       return [...this.sessions.values()];
//     }
//   }

//   export default InMemorySessionStore;

// // abstract class
// class SessionStore {
//     findSession(id: string) {}
//     saveSession(id: string, session:unknown){}
//     findAllSessions(){}
//     //   used any to silence the typescript warning. get the correct types
//   sessions:any

// }

// class InMemorySessionStore extends SessionStore {
//     constructor(){
//        super();
//        this.sessions = new Map();
//     }

//     findSession(id: string): string {
//         return this.sessions.get(id)
//     }

//     saveSession(id: string, session: unknown): void {
//         this.sessions.set(id, session)
//     }

//     findAllSessions(): any[] {
//         return [...this.sessions.values()]
//     }
// }

// export default InMemorySessionStore
