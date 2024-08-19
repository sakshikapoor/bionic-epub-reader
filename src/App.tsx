import ePub, { Book, Rendition } from "epubjs";
import React from "react";

let book: Book;
interface StateConstructor {
  rendition: Rendition | undefined;
  pageNumber: number | undefined;
  touchStart: number;
  touchEnd: number;
  width: number;
}
export class App extends React.Component<any, StateConstructor> {
  constructor(props: any) {
    super(props);
    this.state = {
      rendition: undefined,
      pageNumber: undefined,
      touchStart: 0,
      touchEnd: 0,
      width: window.innerWidth,
    };
  }

  handleTouchStart(e) {
    this.setState({
      touchStart: e.targetTouches[0].clientX,
    });
  }

  handleTouchMove(e) {
    this.setState({
      touchEnd: e.targetTouches[0].clientX,
    });
  }

  handleTouchEnd() {
    if (this.state.touchStart - this.state.touchEnd > 150) {
      // do your stuff here for left swipe
      // moveSliderRight();
      console.log("right");
      this.clickHandle(false);
    }

    if (this.state.touchStart - this.state.touchEnd < -150) {
      // do your stuff here for right swipe
      console.log("left");
      this.clickHandle(true);
    }
  }

  loadBook = (arrayBuffer: any) => {
    book = ePub(arrayBuffer);

    let rend = book.renderTo("viewer", {
      width: this.state.width,
      height: "100%",
    });
    rend.hooks.render.register(this.transformer);
    rend.display();
    this.setState({
      rendition: rend,
    });
  };

  transformer(contents: any) {
    let html = contents.contents.document;
    let getTransformedWords = (words: string[]) => {
      let u = words.map((word: string) => {
        const boldCharCount = 3;
        if (word.length <= boldCharCount) {
          return `<strong>${word}</strong>`;
        } else {
          const boldPart = word.slice(0, boldCharCount);
          const restPart = word.slice(boldCharCount);
          return `<strong>${boldPart}</strong>${restPart}`;
        }
      });
      return u;
    };

    let y = html.getElementsByTagName("p", "div", "span", "i", "a");
    const length = y.length;
    for (let i = 0; i < length; i++) {
      const element = y[i];
      if (element.children.length > 0) {
        for (let j = 0; j < element.childNodes.length; j++) {
          const child = element.childNodes[j];
          const text = child.textContent;
          let words = text.split(/\s+/);
          const transformedWords = getTransformedWords(words);

          if (child.nodeType === Node.TEXT_NODE) {
            const y = document.createElement("span");
            y.innerHTML = transformedWords.join(" ");
            child.parentNode.insertBefore(y, child);
            child.parentNode.removeChild(child);
          } else {
            child.innerHTML = transformedWords.join(" ");
          }
        }

        continue;
      }

      let words = element.innerText.split(/\s+/);
      const transformedWords = getTransformedWords(words);
      element.innerHTML = transformedWords.join(" ");
    }
  }

  onChangeFunction = (e: any) => {
    const file = e.target.files[0];
    if (file.type !== "application/epub+zip") {
      alert("Please select an ePub file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e?.target?.result;
      this.loadBook(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  };

  clickHandle(isPrev: boolean) {
    if (isPrev) {
      this.state.rendition?.prev();
    } else {
      this.state.rendition?.next();
    }
  }

  render() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <div style={{ padding: "10px" }}>
          <input
            type="file"
            id="file-input"
            accept=".epub"
            onChange={(e) => this.onChangeFunction(e)}
          />
        </div>
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: "200px",
          }}
          onTouchStart={(touchStartEvent) =>
            this.handleTouchStart(touchStartEvent)
          }
          onTouchMove={(touchMoveEvent) => this.handleTouchMove(touchMoveEvent)}
          onTouchEnd={() => this.handleTouchEnd()}
        ></div>
        <div
          id="viewer"
          style={{ width: "100%", height: "600px", border: "1px solid #ccc" }}
        ></div>
        <div
          style={{
            width: "100%",
            justifyContent: "space-between",
            display: "flex",
          }}
        ></div>
      </div>
    );
  }
}

export default App;
