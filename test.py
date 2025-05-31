import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.zeroeval.com/proxy",
    api_key='sk_ze_c9YofcEqlpyRRYUS5WlFbqNTiVD_5PfOKmy-swtER60'
)

try:
    response = client.chat.completions.create(
        model="anthropic/claude-sonnet-4-20250514",
        messages=[
      {
        "role": "user",
        "content": "What is the capital of France?"
      }
    ]
    )
    print(response.choices[0].message.content)

except Exception as e:
    print(f"An error occurred: {e}")