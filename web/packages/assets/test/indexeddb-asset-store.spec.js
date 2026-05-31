import { createAssetBundle, createIndexedDbAssetStore, readAssetText } from "../src/index";

class FakeRequest {
    result;
    error = null;
    onsuccess = null;
    onerror = null;
    succeed(result) {
        this.result = result;
        queueMicrotask(() => {
            this.onsuccess?.();
        });
    }
}
class FakeOpenRequest extends FakeRequest {
    onupgradeneeded = null;
    succeedWithOptionalUpgrade(database, needsUpgrade) {
        this.result = database;
        queueMicrotask(() => {
            if (needsUpgrade) {
                this.onupgradeneeded?.();
            }
            this.onsuccess?.();
        });
    }
}
class FakeObjectStore {
    records;
    constructor(records) {
        this.records = records;
    }
    put(value, key) {
        const request = new FakeRequest();
        this.records.set(key, value);
        request.succeed(value);
        return request;
    }
    get(key) {
        const request = new FakeRequest();
        request.succeed(this.records.get(key));
        return request;
    }
    getAll() {
        const request = new FakeRequest();
        request.succeed(Array.from(this.records.values()));
        return request;
    }
    delete(key) {
        const request = new FakeRequest();
        this.records.delete(key);
        request.succeed(undefined);
        return request;
    }
}
class FakeTransaction {
    stores;
    constructor(stores) {
        this.stores = stores;
    }
    objectStore(name) {
        const records = this.stores.get(name);
        if (!records) {
            throw new Error(`Missing store: ${name}`);
        }
        return new FakeObjectStore(records);
    }
}
class FakeDatabase {
    stores = new Map();
    objectStoreNames = {
        contains: (name) => this.stores.has(name)
    };
    createObjectStore(name) {
        if (!this.stores.has(name)) {
            this.stores.set(name, new Map());
        }
        return new FakeObjectStore(this.stores.get(name));
    }
    transaction(name, _mode) {
        return new FakeTransaction(this.stores);
    }
}
class FakeIndexedDbFactory {
    database = null;
    open(_name, _version) {
        const request = new FakeOpenRequest();
        const needsUpgrade = !this.database;
        this.database ??= new FakeDatabase();
        request.succeedWithOptionalUpgrade(this.database, needsUpgrade);
        return request;
    }
}
function validBundle() {
    const result = createAssetBundle([
        { path: "HOSPITAL.CFG", bytes: new TextEncoder().encode("LANGUAGE=ENG\n") },
        { path: "HOSPITAL.EXE", bytes: new TextEncoder().encode("MZ") },
        { path: "DATA/ANIMS.DAT", bytes: new Uint8Array([1]) },
        { path: "LEVELS/LEVEL01.LEV", bytes: new TextEncoder().encode("level") },
        { path: "QDATA/TEXT.DAT", bytes: new Uint8Array([2]) }
    ]);
    if (result.status !== "ready") {
        throw new Error("Expected fixture asset bundle to be ready");
    }
    return result.bundle;
}
describe("indexeddb asset store", () => {
    it("persists imported asset bytes and manifest for reload", async () => {
        const store = createIndexedDbAssetStore({
            indexedDbFactory: new FakeIndexedDbFactory(),
            databaseName: "asset-store-test"
        });
        await store.saveBundle(validBundle());
        const loaded = await store.loadBundle();
        expect(loaded?.manifest.importedFileCount).toBe(5);
        expect(readAssetText(loaded, "hospital.cfg")).toBe("LANGUAGE=ENG\n");
    });
    it("deletes persisted asset bundles", async () => {
        const store = createIndexedDbAssetStore({
            indexedDbFactory: new FakeIndexedDbFactory(),
            databaseName: "asset-store-delete-test"
        });
        await store.saveBundle(validBundle());
        expect(await store.loadBundle()).toBeTruthy();
        await store.deleteBundle();
        expect(await store.loadBundle()).toBeNull();
    });
});
