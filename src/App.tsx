import ePub, { Book, Rendition } from "epubjs";
import React from "react";
import "./App.css";

let book: Book;
interface StateConstructor {
  rendition: Rendition | undefined;
  pageNumber: number | undefined;
  touchStart: number;
  touchEnd: number;
  width: number;
  isLoaded: boolean;
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
      isLoaded: false,
    };
  }

  handleTouchStart(e: any) {
    this.setState({
      touchStart: e.targetTouches[0].clientX,
    });
  }

  handleTouchMove(e: any) {
    this.setState({
      touchEnd: e.targetTouches[0].clientX,
    });
  }

  handleTouchEnd() {
    if (this.state.touchStart - this.state.touchEnd > 0) {
      // do your stuff here for left swipe
      // moveSliderRight();
      this.clickHandle(false);
    }

    if (this.state.touchStart - this.state.touchEnd < 0) {
      // do your stuff here for right swipe
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
      isLoaded: true,
    });

    rend.on("rendered", (_: Rendition, iframe: Window) => {
      iframe.document.documentElement.addEventListener(
        "touchstart",
        (event: any) => {
          this.handleTouchStart(event);
        }
      );

      iframe.document.documentElement.addEventListener(
        "touchmove",
        (event: any) => {
          this.handleTouchMove(event);
        }
      );

      iframe.document.documentElement.addEventListener(
        "touchend",
        (event: any) => {
          event.preventDefault();
          this.handleTouchEnd();
        }
      );
      this.setState({
        pageNumber: rend.currentLocation()?.start?.index,
      });
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
        {!this.state.isLoaded && (
          <div style={{ padding: "10px" }}>
            <label htmlFor="file-input" className="custom-file-upload">
              Custom Upload
            </label>
            <input
              type="file"
              id="file-input"
              accept=".epub"
              onChange={(e) => this.onChangeFunction(e)}
            />
          </div>
        )}

        {this.state.isLoaded && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "-webkit-fill-available",
              padding: "10px",
            }}
          >
            <div>{this.state.rendition?.book?.packaging?.metadata.title}</div>
            <div>{this.state.pageNumber}</div>
          </div>
        )}
        {this.state.isLoaded && (
          <div
            id="viewer"
            style={{
              width: "100%",
              height: "100%",
            }}
            onClick={(touchMoveEvent) => this.handleTouchMove(touchMoveEvent)}
          ></div>
        )}
      </div>
    );
  }
}

export default App;
