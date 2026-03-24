document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('command-input');
    const terminalHistory = document.getElementById('terminal-history');
    const terminalContent = document.getElementById('terminal-content');
    
    // Configurable typing speed (ms per character)
    const TYPING_SPEED = 5; 

    // Focus input when clicking anywhere in the terminal content area
    if (terminalContent) {
        terminalContent.addEventListener('click', (e) => {
            // Don't focus if selecting text
            if (window.getSelection().toString()) return;
            // Don't focus if clicking a link
            if (e.target.tagName === 'A') return;
            
            if (input) input.focus();
        });
    }

    if (input) {
        // Initial setup for indentation
        const prompt = document.querySelector('.input-line .prompt');
        if (prompt) {
            // Wait slightly for layout or font loading
            setTimeout(() => {
                const promptWidth = prompt.offsetWidth;
                input.style.textIndent = (promptWidth + 5) + 'px'; // +5px buffer
            }, 50);
        }

        // Auto-resize logic
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            scrollToBottom();
        });

        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const command = input.value;
                input.value = ''; // Clear input immediately
                input.style.height = 'auto'; // Reset height
                
                // Create command element
                const commandDiv = document.createElement('div');
                commandDiv.innerHTML = `<span class="prompt">guest@dsr:~$</span> ${escapeHtml(command)}`;
                terminalHistory.appendChild(commandDiv);

                scrollToBottom();

                if (command.trim() === '') return;

                if (command.toLowerCase().trim() === 'clear') {
                    terminalHistory.innerHTML = '';
                    return;
                }
                
                if (command.toLowerCase().trim() === 'help') {
                    const helpDiv = document.createElement('div');
                    helpDiv.className = 'response';
                    terminalHistory.appendChild(helpDiv);
                    
                    const helpText = `Comandos disponibles:
- help: Muestra este mensaje de ayuda
- clear: Limpia el historial de la terminal
- [cualquier pregunta]: Chatea con el asistente de IA`;
                    
                    await typeText(helpDiv, helpText);
                    scrollToBottom();
                    return;
                }

                // Create response element (initially empty)
                const responseDiv = document.createElement('div');
                responseDiv.className = 'response';
                // Add a blinking cursor initially to show it's working
                const cursorSpan = document.createElement('span');
                cursorSpan.className = 'cursor';
                responseDiv.appendChild(cursorSpan);
                
                terminalHistory.appendChild(responseDiv);
                scrollToBottom();

                try {
                    // Check if there is a custom API endpoint defined in the body dataset
                    const apiEndpoint = document.body.dataset.apiEndpoint || '/api/chat';
                    
                    const response = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ message: command })
                    });

                    // Remove the initial cursor before typing the response
                    responseDiv.innerHTML = '';

                    if (response.ok) {
                        const data = await response.json();
                        await typeText(responseDiv, data.response);
                    } else {
                        responseDiv.innerHTML = '<span style="color: red;">Error: Fallo al conectar con el servidor.</span>';
                    }
                } catch (error) {
                    responseDiv.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
                }
                scrollToBottom();
            }
        });
    }

    function scrollToBottom() {
        if (terminalContent) {
            terminalContent.scrollTop = terminalContent.scrollHeight;
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Simulates typing text into an element.
     * @param {HTMLElement} element The element to type into.
     * @param {string} text The text to type.
     */
    function typeText(element, text) {
        return new Promise((resolve) => {
            if (!text) {
                resolve();
                return;
            }

            let i = 0;
            element.innerHTML = ''; // Clear content
            
            // Create a span for the text content
            const textSpan = document.createElement('span');
            element.appendChild(textSpan);
            
            // Add blinking cursor at the end
            const cursorSpan = document.createElement('span');
            cursorSpan.className = 'cursor';
            element.appendChild(cursorSpan);

            function typeChar() {
                if (i < text.length) {
                    const char = text.charAt(i);
                    
                    if (char === '\n') {
                        textSpan.appendChild(document.createElement('br'));
                    } else {
                        textSpan.appendChild(document.createTextNode(char));
                    }
                    
                    i++;
                    scrollToBottom();
                    setTimeout(typeChar, TYPING_SPEED);
                } else {
                    // Finished typing
                    // Optional: remove cursor after done, or keep it blinking
                    cursorSpan.remove(); 
                    resolve();
                }
            }
            
            typeChar();
        });
    }
});
