# Beer Guesser

A simple app that uses a RL trained llm models to guess the brand of a czech beer company from a bottle.

## How to run

```bash
bun install
bun run dev
```

## How to use

1. In the /upload page, upload images of beer bottles
2. In the / page, select the image you want to guess the brand of
3. Use a ocr model to describe the bottle or provide your description
4. Use the description to guess the beer brand

## Model info

Models where trained using Prime Intellect's RL training. See [Prime Intellect's documentation](https://docs.primeintellect.ai/prime-rl/index) for more information.

Training environment: [https://app.primeintellect.ai/dashboard/environments/padisoft-sro/czech-beer-brand-name](https://app.primeintellect.ai/dashboard/environments/padisoft-sro/czech-beer-brand-name)
