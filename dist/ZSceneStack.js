/**
 * Static stack of ZScene instances.
 * Mirrors the PIXI/Phaser ZSceneStack interface exactly.
 */
export class ZSceneStack {
    static stack = [];
    static stackSize = 0;
    static top = 0;
    static push(resource) {
        this.stack[this.top] = resource;
        this.top++;
        this.stackSize++;
    }
    static pop() {
        if (this.stackSize > 0) {
            this.top--;
            this.stackSize--;
            const scene = this.stack[this.top];
            // Drop the slot so a popped scene no longer receives resize or spawn calls.
            this.stack.length = this.top;
            return scene;
        }
        return null;
    }
    static peek() {
        if (this.stackSize > 0)
            return this.stack[this.top - 1];
        return null;
    }
    static getStackSize() { return this.stackSize; }
    static clear() {
        this.stack = [];
        this.stackSize = 0;
        this.top = 0;
    }
    static spawn(templateName) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            const ent = this.stack[i].spawn(templateName);
            if (ent)
                return ent;
        }
        return undefined;
    }
    static resize(width, height) {
        for (let i = this.stack.length - 1; i >= 0; i--) {
            this.stack[i].resize(width, height);
        }
    }
}
//# sourceMappingURL=ZSceneStack.js.map