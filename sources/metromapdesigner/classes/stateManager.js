// Copyright (C) 2024 Tim van der Voord (tim@vandervoord.nl)
//
// This file may be distributed under the terms of the GNU GPLv3 license.

/**
 * Class representing a state manager for managing undo/redo functionality
 * on a metromap application. This class handles saving, reverting, clearing,
 * and redoing states in a stack with support for hooks.
 */
export default class stateManager {
    /**
     * Indicates whether state saving is enabled.
     * @type {boolean}
     */
    enableStateSaving = true;

    /**
     * Hook functions to notify state changes. Hooks are stored by event name.
     * @type {Object}
     */
    hooks = {
        save: [],
        revert: [],
        redo: [],
        clear: [],
    };

    /**
     * Stack to store the states for undo functionality.
     * @type {Array<string>}
     */
    stateStack = [];

    /**
     * Stack to store states for redo functionality.
     * @type {Array<string>}
     */
    redoStack = [];

    /**
     * Maximum number of states the stack can hold.
     * @type {number}
     */
    stackSize;

    /**
     * Constructs the stateManager instance.
     * @param {number} stateStackSize - Maximum size of the state stack. Default is 30.
     * @param {boolean} enabled - Whether state saving is enabled. Default is true.
     */
    constructor(stateStackSize = 30, enabled = true) {
        this.enableStateSaving = enabled;
        this.stackSize = stateStackSize;
    }

    /**
     * Adds a hook for a specific event.
     * @param {string} event - The event name ('save', 'revert', 'redo', or 'clear').
     * @param {Function} callback - The callback function to register.
     */
    addHook(event, callback) {
        if (this.hooks[event]) {
            this.hooks[event].push(callback);
        } else {
            throw new Error(`Invalid event name: ${event}`);
        }
    }

    /**
     * Runs all hooks for a specific event.
     * @param {string} event - The event name ('save', 'revert', 'redo', or 'clear').
     * @param {any} data - The data to pass to the hooks.
     */
    runHooks(event, data) {
        if (this.hooks[event]) {
            this.hooks[event].forEach((hook) => hook(data));
        }
    }

    /**
     * Saves the current state of the map object to the state stack.
     * If the stack exceeds its maximum size, the oldest state is removed.
     *
     * @param {Object} mapObject - The map object whose state needs to be saved.
     * @returns {boolean} - Returns true if the state was saved successfully, false otherwise.
     * @throws {Error} - Throws an error if the state cannot be retrieved from the map object.
     */
    saveState(mapObject) {
        if (!this.enableStateSaving) {
            console.log("State saving is disabled");
            return false;
        }

        // Check if the stack has reached its maximum size
        if (this.stateStack.length >= this.stackSize) {
            this.stateStack.shift();
        }

        // Get state
        const state = mapObject.getCanvasContent();

        // Save the state
        if (!state) throw new Error('Statemanager: State of metromap could not be retrieved');
        this.stateStack.push(state);
        this.redoStack = []; // clear redo state

        // Run hooks for the 'save' event
        this.runHooks('save', state);
        return true;
    }

    /**
     * Reverts to the last saved state in the state stack.
     * Removes the reverted state from the stack.
     *
     * @returns {string|boolean} - The previous state as a string if available, or false if no states exist or state saving is disabled.
     */
    revertState(mapObject) {
        if (!this.enableStateSaving) {
            console.log("Statemanager: state saving is disabled");
            return false;
        }
        if (this.stateStack.length > 0) {
            // Get current state and add it to the redo state
            const currentState = mapObject.getCanvasContent();
            if (!currentState) {
                throw new Error('Statemanager: Current state could not be retrieved for revert operation');
            }
            this.redoStack.push(currentState);

            // Retrieve last saved state and run hooks
            const previousState = this.stateStack.pop();
            this.runHooks('revert', previousState);
            return previousState;
        } else {
            console.log('Statemanager: no previous state available');
            return false;
        }
    }

    /**
     * Restores the most recently undone state from the redo stack.
     *
     * @returns {string|boolean} - The state as a string if redo is possible, or false otherwise.
     */
    redoState() {
        if (!this.enableStateSaving) {
            console.log("Statemanager: state saving is disabled");
            return false;
        }
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.stateStack.push(nextState);

            // Run hooks for the 'redo' event
            this.runHooks('redo', nextState);
            return nextState;
        } else {
            console.log('Statemanager: no redo state available');
            return false;
        }
    }

    /**
     * Clears all states from the state stack.
     */
    clearStates() {
        this.stateStack = [];
        this.redoStack = [];

        // Run hooks for the 'clear' event
        this.runHooks('clear', null);
    }
}