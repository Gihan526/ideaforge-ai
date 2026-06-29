"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect, useRef } from "react";

function AddIdeas() {
  const [show, setShow] = useState(false);
  const modalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setShow(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [show]);

  useEffect(() => {
    const handleKeyesc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShow(false)
      }
    };

    window.addEventListener('keydown', handleKeyesc);
    return () => { window.removeEventListener('keydown', handleKeyesc) };
  }, [show]);

  return (
    <div>
      <Button
        className="w-50 m-10"
        variant="secondary"
        onClick={() => setShow(true)}
      >
        Add Idea
      </Button>
      {show && (
        <Input className="w-70 m-70" ref={modalRef} placeholder="enter title" />
      )}
    </div>
  );
}

export default AddIdeas;
