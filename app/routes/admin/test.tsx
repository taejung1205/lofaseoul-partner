import { Space } from "@mantine/core";
import {
  ActionFunction,
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
  UploadHandler,
} from "@remix-run/node";
import { useActionData, useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { PageLayout } from "~/components/page_layout";
import { uploadImageTest } from "~/services/firebase.server";

const FileUpload = styled.input`
  width: 0;
  height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
`;

const FileUploadButton = styled.label`
  font-size: 16px;
  background-color: black;
  width: 60px;
  height: 32px;
  color: white;
  border: none;
  font-weight: 700;
  line-height: 1.8;
  cursor: pointer;
`;

export const action: ActionFunction = async ({ request }) => {
  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, contentType, data, filename }) => {
      console.log("name", name);
      for await (const file of data) {
        const result = await uploadImageTest(file);
        return result.toString();
      }
    },
    // parse everything else into memory
    unstable_createMemoryUploadHandler({
      maxPartSize: 30_000_000,
    })
  );

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler // <-- we'll look at this deeper next
  );

  // the returned value for the file field is whatever our uploadHandler returns.
  // Let's imagine we're uploading the avatar to s3,
  // so our uploadHandler returns the URL.
  console.log(formData);
  const mainImageFile = formData.get("mainImageFile");

  // update the currently logged in user's avatar in our database
  // await uploadImageTest(mainImageFile);

  // success! Redirect to account page
  console.log(mainImageFile);

  return mainImageFile;
};

export default function Test() {
  const [mainImageFile, setMainImageFile] = useState<File>(); //메인 이미지 (필수)
  const formRef = useRef<HTMLFormElement>(null);
  const submit = useSubmit();
  const actionData = useActionData();

  function uploadImage() {
    const formData: any = new FormData(formRef.current ?? undefined);
    formData.set("mainImageFile", mainImageFile);
    submit(formData, { method: "post", encType: "multipart/form-data" });
  }

  useEffect(() => {
    if (actionData !== undefined && actionData !== null) {
      console.log(actionData);
    }
  }, [actionData]);

  return (
    <PageLayout>
      Test
      <FileUpload
        type="file"
        id="uploadMainImage"
        accept=".png,.jpg,.jpeg,.svg"
        onChange={(e) => {
          if (e.target.files) {
            setMainImageFile(e.target.files[0]);
          }
        }}
      />
      <Space h={12} />
      <FileUploadButton htmlFor="uploadMainImage">추가</FileUploadButton>
      <button onClick={() => uploadImage()}>업로드</button>
    </PageLayout>
  );
}
