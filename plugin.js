class SefariaPlugin extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // State variables
    this.counter = 0
    this.uiState = 0
    this.query = ''
    this.loadingElemCancelToken = null;
    this.loop()
    // Create a container for the results or player
    this.container = document.createElement('div');
    this.container.classList.add('container')
    this.content = document.createElement('div');
    this.shadowRoot.appendChild(this.container);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      div {
        font-family: Arial, sans-serif;
        font-size: 18px;
      }
      h3 {
        margin: 0px;
      }
      .container {
        margin-top: 1em;
        background-color: rgba(0,0,0,0.05);
        padding: 1em;
        border-radius: 1em;
      }
    `;

    this.loadingElem = document.createElement('div')
    this.container.appendChild(this.loadingElem)
    this.container.appendChild(this.content)
    this.shadowRoot.appendChild(style);
  }

  // Observe the 'sref' attribute
  static get observedAttributes() {
    return ['sref'];
  }

  // Called when the 'sref' attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'sref' && newValue !== oldValue) {
      if(this.uiState === 0 || this.uiState === 5){
        this.fetchData(newValue);
      }
    }
  }

  // Fetch data when the component is added to the DOM
  connectedCallback() {
    const query = this.getAttribute('sref');
    if (query) {
      // this.fetchData(query);
    }
  }

  async fetchData(query) {
    this.loopLoadingElem()
    this.uiState = 1
    this.query = query
    this.content.innerHTML = null;
    const apiUrl = `https://www.sefaria.org/api/v3/texts/${query}`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const tempElem = document.createElement('p');
      tempElem.innerHTML = data.versions.find((version) => version.actualLanguage !== 'en').text
      const text = tempElem.textContent
      const promptResult = await this.promptLLM(text, query)
      this.uiState = 2
      this.renderResults(promptResult, query);
    } catch (error) {
      this.uiState = 3
    }
  }

  async promptLLM(text, query) {
    // Use Google Translate API instead of OpenAI
    const url =
      "https://translate.googleapis.com/translate_a/single" +
      "?client=gtx" +
      "&sl=he" +
      "&tl=en" +
      "&dt=t" +
      "&q=" + encodeURIComponent(text);
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data[0][0][0];
    } catch (error) {
      return 'Translation error.';
    }
  }

  async renderResults(text, query) {
    this.uiState = 4
    const pElem = document.createElement('p');
    const footerElem = document.createElement('small');
    this.content.appendChild(pElem);
    this.content.appendChild(footerElem);
    let s = ''
    for (let idx = 0; idx < text.length; idx++) {
      s+=text[idx]
      await this.sleep(Math.floor((Math.random() * 20)))
      pElem.innerText = s
    }
    
    const footerStr = '(Please understand! I am an experimental 🤖. I can hallucinate sometimes. 🫣 So please take my translations with a grain of salt!)'
    let footerS = ''
    for (let idx = 0; idx < footerStr.length; idx++) {
      footerS+=footerStr[idx]
      await this.sleep(Math.floor((Math.random() * 50)))
      footerElem.innerText = footerS
    }
    this.uiState = 5
  }

  loopLoadingElem(){
    this.loadingElemCancelToken = setInterval(()=>{
      const n = this.counter % 4;
      switch (this.uiState) {
        case 1:
          this.loadingElem.innerHTML = `<h3>🤖 is 🤔 ${'.'.repeat(n)}</h3>`;
          return;
        case 3:
          this.loadingElem.innerHTML = `<h3>🤖 🤒</h3><small>Whoops! Something went wrong.</small>`;
          return;
        case 4:
          this.loadingElem.innerHTML = `<h3>🤖 is typing ${'.'.repeat(n)}</h3>`;
          return;
        case 5:
          this.loadingElem.innerHTML = `<h3>🤖 Translation of ${this.query}</h3>`;
          clearInterval(this.loadingElemCancelToken)
          return;
        default:
          clearInterval(this.loadingElemCancelToken)
          return;
      }
    }, 100)
  }

  loop(){
    setInterval(()=>{
        console.log(`Counter: ${this.counter}`)
        console.log(`UI State: ${this.uiState}`)
        this.counter++
        const n = this.counter % 4
    }, 1000)

  }

  sleep(ms){
    return new Promise((resolve)=>{
      setTimeout(resolve, ms)
    })
  }
}

// Define the new custom element
customElements.define('sefaria-plugin', SefariaPlugin);
